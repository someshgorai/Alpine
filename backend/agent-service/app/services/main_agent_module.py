import os
import re
import json
import time
from typing import Dict, Any, List, Tuple
from dotenv import load_dotenv
from langchain_huggingface import HuggingFaceEndpoint, ChatHuggingFace
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser

##Config
PDF_PATH ="Nit_jsr.pdf"
OUTPUT_JSON_PATH = ".lib/reports/rfp_summary.json"

def llm_model():
    load_dotenv()
    api_token = os.getenv("HUGGINGFACEHUB_API_TOKEN")
    if not api_token:
        raise RuntimeError("HUGGINGFACEHUB_API_TOKEN is not set in environment variables.")

    llm = HuggingFaceEndpoint(
        repo_id="Qwen/Qwen2.5-Coder-32B-Instruct",
        task="text-generation",
        huggingfacehub_api_token=os.getenv("HUGGINGFACEHUB_API_TOKEN"),
        max_new_tokens=2000,
        temperature=0.3,
    )

    return ChatHuggingFace(llm=llm)

def read_pdf_text(pdf_path: str) -> str:
    loader = PyPDFLoader(pdf_path)
    docs = loader.load()
    return "\n\n".join(d.page_content for d in docs)


def split_into_chunks(text: str, chunk_size: int, chunk_overlap: int) -> List[str]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", " ", ""],
    )
    return splitter.split_text(text)

CHUNK_MAP_PROMPT = PromptTemplate(
    template=(
        "You are the MAIN AGENT creating a STRICT JSON fragment (no commentary, no backticks) for a single RFP PDF chunk.\n"
        "Your task is to EXTRACT ONLY the information present in THIS CHUNK. If a field is not present in this chunk, omit it.\n\n"
        "Return JSON with possible PARTIAL KEYS among:\n"
        "RFP_Metadata: Title, Issuing_Organization, Submission_Deadline, Summary\n"
        "Technical_Summary: Products_In_Scope, Key_Specifications, Tests_And_Standards\n"
        "Pricing_Summary: Tests_Required, Services, Other_Cost_Drivers\n\n"
        "Rules:\n"
        "- Output MUST be valid JSON, nothing else.\n"
        "- Do NOT invent facts not found in this chunk.\n"
        "- Keep text concise and plain.\n\n"
        "CHUNK TEXT:\n{chunk_text}\n"
    ),
    input_variables=["chunk_text"],
)

REDUCE_PROMPT = PromptTemplate(
    template=(
        "You are merging multiple PARTIAL JSON fragments extracted from an RFP into ONE final JSON object.\n"
        "Use ONLY the information present across these fragments. If multiple fragments provide the same field, prefer the most complete/precise phrasing.\n"
        "Output MUST strictly follow this JSON structure (all keys present, strings/lists filled if known; if unknown, use an empty list or an empty string):\n\n"
        "{schema}\n\n"
        "Rules:\n"
        "- Output ONLY valid JSON (no comments, no backticks).\n"
        "- Do NOT hallucinate: if a field is unknown after merging, set it to \"\" for strings or [] for lists.\n"
        "- Keep content concise.\n\n"
        "PARTIAL FRAGMENTS (JSON list):\n{partials_json}\n"
    ),
    input_variables=["schema", "partials_json"],
)
EXPECTED_SCHEMA_EXAMPLE = {
    "RFP_Metadata": {
        "Title": "Supply, Installation, and Testing of Network Equipment for ABC Industries",
        "Issuing_Organization": "ABC Industries Pvt. Ltd.",
        "Submission_Deadline": "15 January 2026, 5:00 PM IST",
        "Summary": "One concise paragraph in plain text."
    },
    "Technical_Summary": {
        "Products_In_Scope": [
            "Layer-3 Managed Switch (Core Switch)",
            "Access Point (Wi-Fi 6)",
            "Network Firewall Appliance"
        ],
        "Key_Specifications": [
            "ProductName: spec1, spec2, spec3 ...",
        ],
        "Tests_And_Standards": [
            "Clear bullet-like strings of requirements/tests"
        ]
    },
    "Pricing_Summary": {
        "Tests_Required": [
            "FAT for 10% items",
            "SAT for all equipment",
            "Network performance test"
        ],
        "Services": [
            "Supply and quantities, install & commissioning timelines"
        ],
        "Other_Cost_Drivers": [
            "Prices in INR inclusive of duties/taxes, payment milestones, warranty"
        ]
    }
}

# ==== MAIN AGENT PIPELINE ====
def main_agent_pipeline() -> Dict[str, Any]:
    print("\n🚀 Running Main Agent...")
    model = llm_model()
    text = read_pdf_text(PDF_PATH)
    chunks = split_into_chunks(text, chunk_size=4000, chunk_overlap=400)

    map_chain = CHUNK_MAP_PROMPT | model | StrOutputParser()
    partial_jsons = []

    for i, chunk in enumerate(chunks):
        print(f"Processing chunk {i + 1}/{len(chunks)}...")
        result = map_chain.invoke({"chunk_text": chunk})
        try:
            parsed_chunk = json.loads(result)
            partial_jsons.append(parsed_chunk)
        except json.JSONDecodeError:
            print(f"⚠️ Chunk {i + 1} produced invalid JSON, skipping.")

    # Merge all partial outputs
    reduce_chain = REDUCE_PROMPT | model | StrOutputParser()
    schema_str = json.dumps(EXPECTED_SCHEMA_EXAMPLE, indent=2)
    final_summary_input = json.dumps(partial_jsons, indent=2)

    print("Merging extracted fragments...")
    merged_output = reduce_chain.invoke({
        "schema": schema_str,
        "partials_json": final_summary_input
    })

    try:
        final_json = json.loads(merged_output)
    except json.JSONDecodeError:
        print("⚠️ Invalid JSON from LLM, saving raw output.")
        final_json = {"raw_text": merged_output}

    # Save to disk for traceability
    with open(OUTPUT_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(final_json, f, indent=2)

    print(f"✅ Main Agent completed. Output saved to {OUTPUT_JSON_PATH}")
    return final_json


if __name__ == "__main__":
    main_agent_pipeline()

