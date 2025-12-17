import os
import json
import numpy as np
from dotenv import load_dotenv
from typing import Dict, Any
from langchain_huggingface import HuggingFaceEndpoint, ChatHuggingFace
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser

# CONFIG
TECH_OUTPUT_PATH = "./lib/reports/technical_agent_output.json"
RFP_SUMMARY_PATH = "./lib/reports/rfp_summary.json"
PRODUCT_PRICE_PATH = "./constants/product_prices.json"
SERVICE_PRICE_PATH = "./constants/test_service_prices.json"
OUTPUT_PRICING_JSON = "./lib/reports/pricing_agent_output.json"

class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return super(NumpyEncoder, self).default(obj)

# LLM loader
def llm_model():
    load_dotenv()
    api_token = os.getenv("HUGGINGFACEHUB_API_TOKEN")
    if not api_token:
        raise RuntimeError("HUGGINGFACEHUB_API_TOKEN not set.")
    llm = HuggingFaceEndpoint(
        repo_id="Qwen/Qwen2.5-Coder-32B-Instruct",
        task="text-generation",
        huggingfacehub_api_token=api_token,
        max_new_tokens=2000,
        temperature=0.0,  # Strict determinism
    )
    return ChatHuggingFace(llm=llm)


def load_json(path: str):
    if not os.path.exists(path):
        return {}
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


# --- MODIFIED PROMPT FOR TOP 1 ONLY ---
PRICING_PROMPT = PromptTemplate(
    input_variables=[
        "tech_json",
        "rfp_json",
        "product_prices_json",
        "service_prices_json"
    ],
    template=(
        "You are a deterministic Pricing Agent. You will receive technical recommendations and must generate a quote ONLY for the winning OEM.\n\n"

        "INPUTS:\n"
        "1) technical_output: Contains 'RFP_Product', 'Top_OEM', and 'Top_3_Recommendations'.\n"
        "2) product_prices: Mapping of Model/OEM to unit prices (INR).\n"
        "3) service_prices: Mapping of service names to prices (INR).\n"
        "4) rfp_summary: Context on required tests.\n\n"

        "TASK:\n"
        "For each item in technical_output:\n"
        "1. Identify the 'Top_OEM'.\n"
        "2. Find the single object in 'Top_3_Recommendations' that belongs to this Top_OEM.\n"
        "   - If 'Top_3_Recommendations' is empty, return 'Status': 'No Technical Match Found'.\n"
        "3. Compute pricing for ONLY this single winning item.\n"
        "   - Base Price: Lookup Model > Product_Type > OEM in product_prices.\n"
        "   - Services: Add 'Installation', 'Commissioning', 'FAT', 'SAT' costs from service_prices.\n"
        "   - Total: Base Price + Services.\n"
        "4. If price is missing, use 'To Be Quoted'.\n\n"

        "STRICT OUTPUT JSON SCHEMA:\n"
        "{{\n"
        "  \"Pricing_Summary\": [\n"
        "    {{\n"
        "      \"RFP_Product\": \"<string>\",\n"
        "      \"Winning_OEM\": \"<string>\",\n"
        "      \"Winning_Quote\": {{\n"
        "          \"Model\": \"<string>\",\n"
        "          \"Unit_Price_INR\": <int or 'To Be Quoted'>,\n"
        "          \"Services_Cost_INR\": <int>,\n"
        "          \"Applied_Services\": [\"FAT\", \"SAT\", ...],\n"
        "          \"Total_Item_Cost\": <int or 'To Be Quoted'>\n"
        "      }}\n"
        "    }}\n"
        "  ],\n"
        "  \"Grand_Total_INR\": <int>\n"
        "}}\n\n"

        "DATA:\n"
        "TECHNICAL_OUTPUT:\n{tech_json}\n\n"
        "PRODUCT_PRICES:\n{product_prices_json}\n\n"
        "SERVICE_PRICES:\n{service_prices_json}\n\n"
        "RFP_SUMMARY:\n{rfp_json}\n\n"

        "Return ONLY valid JSON. No markdown."
    )
)


def pricing_agent_llm_pipeline():
    print("Running Top-1 Pricing Agent...")

    tech = load_json(TECH_OUTPUT_PATH)
    rfp = load_json(RFP_SUMMARY_PATH)
    product_prices = load_json(PRODUCT_PRICE_PATH)
    service_prices = load_json(SERVICE_PRICE_PATH)

    # Check if tech output is valid
    if not tech or "RFP_Technical_Recommendations" not in tech:
        print("Error: technical_agent_output.json is missing or invalid.")
        return

    # Prepare inputs
    tech_str = json.dumps(tech, indent=2, ensure_ascii=False, cls=NumpyEncoder)
    rfp_str = json.dumps(rfp, indent=2, ensure_ascii=False, cls=NumpyEncoder)
    prod_prices_str = json.dumps(product_prices, indent=2, ensure_ascii=False, cls=NumpyEncoder)
    svc_prices_str = json.dumps(service_prices, indent=2, ensure_ascii=False, cls=NumpyEncoder)

    llm = llm_model()
    chain = PRICING_PROMPT | llm | StrOutputParser()

    print("Calculations in progress...")
    try:
        llm_response = chain.invoke({
            "tech_json": tech_str,
            "rfp_json": rfp_str,
            "product_prices_json": prod_prices_str,
            "service_prices_json": svc_prices_str
        })

        # Clean potential markdown wrappers
        cleaned_response = llm_response.replace("```json", "").replace("```", "").strip()

        parsed = json.loads(cleaned_response)

        # Validation
        if "Grand_Total_INR" not in parsed:
            parsed["Grand_Total_INR"] = 0

        with open(OUTPUT_PRICING_JSON, "w", encoding="utf-8") as f:
            json.dump(parsed, f, indent=2, ensure_ascii=False)

        print(f"✅ Pricing complete. Quote generated for Top OEMs only -> {OUTPUT_PRICING_JSON}")
        return parsed

    except json.JSONDecodeError:
        print("❌ LLM output was not valid JSON.")
        # Save raw output for debugging
        with open("pricing_debug.txt", "w", encoding="utf-8") as f:
            f.write(llm_response)
        raise


if __name__ == "__main__":
    pricing_agent_llm_pipeline()