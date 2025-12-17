import os
import subprocess
import json
import uuid
import sys
import asyncio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
import logging
from shlex import quote
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.requests import Request

# Import your existing graph builder
from final import build_orchestral_flow


# --- Configuration ---
# This is the URL the scraper will target.
# You can change this to any other tender website.
UPLOAD_PATH = "Nit_jsr.pdf"
FINAL_OUTPUT_PATH = "final_rfp_response.json"

SCRAPER_TARGET_URL = "https://nitjsr.ac.in/Tender/All_Tenders"
SCRAPER_SCRIPT_PATH = "playwright_scraper.py"
MANIFEST_PATH = "scraped_rfps_manifest.json"

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s]: %(message)s")
logger = logging.getLogger(__name__)

# --- FastAPI App Initialization ---
app = FastAPI(
    title="Alpine Agent Backend",
    description="API server to run web scraper and invoke processing agents.",
    version="1.0.0"
)

# --- CORS Middleware ---
# Allows the React frontend (running on a different port) to communicate with this backend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)

# --- Pydantic Models for API validation ---
class SalesAnalyzeRequest(BaseModel):
    rfp_text: str

class TechnicalMatchRequest(BaseModel):
    requirements: List[str]
    db_context: Dict[str, Any]

class InvokeAgentRequest(BaseModel):
    pdf_path: str

# --- Helper Function ---
def format_scraper_results(manifest_data: List[Dict]) -> List[Dict]:
    """Converts the raw scraper manifest into the RFP format the frontend expects."""
    formatted_rfps = []
    for item in manifest_data:
        # The scraper provides limited info, so we create placeholder values.
        filename = os.path.basename(item.get("download_path", "Unknown File"))
        formatted_rfps.append({
            "id": f"scraped-{uuid.uuid4()}",
            "title": filename, # Use filename as title
            "clientName": "Scraped Source", # Placeholder
            "sourceUrl": item.get("pdf_url") or SCRAPER_TARGET_URL,
            "receivedDate": "2024-01-01T00:00:00.000Z", # Placeholder
            "dueDate": "2025-01-01T00:00:00.000Z", # Placeholder
            "rawContent": f"Scraped from: {item.get('pdf_url', 'N/A')}\n\nContext:\n{item.get('context', 'No context captured.')}",
            "status": "INBOX",
            "pdfPath": item.get("download_path"),
        })
    return formatted_rfps


# --- API Endpoints ---

@app.on_event("startup")
async def startup_event():
    logger.info("Backend server starting up...")
    logger.info(f"Scraper will target URL: {SCRAPER_TARGET_URL}")


@app.get("/")
def read_root():
    """Root endpoint to check if the server is running and reachable."""
    return {"status": "Alpine Backend is running and reachable!"}

@app.post("/scraper/run")
async def run_scraper():
    """
    Executes the Playwright scraper script as an async-safe subprocess using the
    same Python interpreter currently running this FastAPI app (sys.executable).
    Runs the blocking subprocess in a thread using asyncio.to_thread to avoid
    blocking the event loop (works on Windows where asyncio subprocess may be unsupported).
    """
    logger.info("Received request to run the web scraper...")

    python_exe = sys.executable  # use same interpreter as running server

    command = [
        python_exe,
        SCRAPER_SCRIPT_PATH,
        "--url", SCRAPER_TARGET_URL,
        "--headless",
    ]

    # Log the command for debugging (quoted)
    logger.info("Starting scraper subprocess: %s", " ".join(quote(x) for x in command))

    try:
        # Run subprocess in a thread so we don't block the asyncio event loop.
        # subprocess.run will observe the timeout and will kill the child on timeout.
        def run_proc():
            return subprocess.run(
                command,
                capture_output=True,
                text=True,
                check=False,  # we'll handle non-zero returncode explicitly
                timeout=300,  # seconds
                cwd=os.getcwd(),
            )

        proc_result = await asyncio.to_thread(run_proc)

        stdout_text = proc_result.stdout or ""
        stderr_text = proc_result.stderr or ""

        if proc_result.returncode != 0:
            logger.error("Scraper script failed with return code %s", proc_result.returncode)
            logger.error("STDOUT: %s", stdout_text)
            logger.error("STDERR: %s", stderr_text)
            # Return a truncated stderr to client to avoid huge payloads
            raise HTTPException(status_code=500, detail=f"Scraper script failed: {stderr_text[:1000]}")

        logger.info("Scraper script executed successfully.")
        logger.info("STDOUT: %s", stdout_text)

        # After execution, read the manifest file it created.
        if os.path.exists(MANIFEST_PATH):
            with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
                scraped_data = json.load(f)

            # Convert the data to the format the frontend needs
            formatted_data = format_scraper_results(scraped_data)
            logger.info("Returning %d formatted RFP(s) to frontend.", len(formatted_data))
            return formatted_data
        else:
            logger.warning("Manifest file not found after scraper run. Returning empty list.")
            return []

    except subprocess.TimeoutExpired:
        logger.error("Scraper script timed out after 5 minutes.")
        raise HTTPException(status_code=504, detail="Scraper script timed out after 5 minutes.")
    except HTTPException:
        # re-raise so FastAPI handles it
        raise
    except Exception as e:
        logger.exception("An unexpected error occurred during scraper execution.")
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

@app.post("/agent/invoke")
async def invoke_main_agent(request: InvokeAgentRequest):
    """
    Triggers the LangGraph Workflow defined in final.py.
    """
    if not os.path.exists(UPLOAD_PATH):
        raise HTTPException(status_code=400, detail="Please upload an RFP PDF first.")

    try:
        print("🚀 API: Starting LangGraph Workflow...")

        # Initialize and compile the graph from your final.py
        graph = build_orchestral_flow()
        executor = graph.compile()

        # Execute the workflow
        # We pass an empty dict as initial state, just like in your main block
        executor.invoke({})

        # Verify output exists
        if not os.path.exists(FINAL_OUTPUT_PATH):
            raise HTTPException(status_code=500, detail="Workflow finished but no output file found.")

        # Load and return the final JSON
        with open(FINAL_OUTPUT_PATH, "r", encoding="utf-8") as f:
            result = json.load(f)

        return result

    except Exception as e:
        print(f"❌ API Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")


# --- To run this server, use the command (from your project root):
#  uvicorn fastapi_app:app --reload --host 0.0.0.0 --port 8000
