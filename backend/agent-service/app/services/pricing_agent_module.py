import os
import json
import numpy as np
from typing import List, Dict, Any
from dotenv import load_dotenv

# Vectorstore / embeddings
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS

# LangChain chaining & prompts
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser

# Hugging Face LLM wrappers
from langchain_huggingface import HuggingFaceEndpoint, ChatHuggingFace

# CONFIG
RFP_JSON_PATH = ".lib/reports/rfp_summary.json"
OEM_JSON_PATH = "./constants/oem_products.json"
OUTPUT_TECHNICAL_JSON = "./lib/reports/technical_agent_output.json"

class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return super(NumpyEncoder, self).default(obj)
# 1. LLM Loader
def llm_model():
    load_dotenv()
    api_token = os.getenv("HUGGINGFACEHUB_API_TOKEN")
    if not api_token:
        raise RuntimeError("HUGGINGFACEHUB_API_TOKEN not set.")

    # Using the Endpoint directly is often faster/stable than Chat wrapper for pure completion,
    # but we will stick to ChatHuggingFace as requested.
    hf_endpoint = HuggingFaceEndpoint(
        repo_id="Qwen/Qwen2.5-Coder-32B-Instruct",
        task="text-generation",
        huggingfacehub_api_token=api_token,
        max_new_tokens=1500,
        temperature=0.2,
    )
    return ChatHuggingFace(llm=hf_endpoint)


# 2. Simple JSON Loader
def load_json(file_path: str) -> Dict[str, Any]:
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}. Returning empty dict.")
        return {}
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)


# 3. Build FAISS Index
def build_faiss_index(oem_products: List[Dict[str, Any]]):
    if not oem_products:
        print("No OEM products found to index.")
        return None

    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    texts, metas = [], []
    for prod in oem_products:
        desc = (
                f"{prod.get('Product_Type', '')} by {prod.get('OEM', '')}, Model {prod.get('Model', '')}. "
                + " ".join(f"{k}: {v}." for k, v in prod.get("Specs", {}).items())
        )
        texts.append(desc)
        metas.append(prod)

    db = FAISS.from_texts(texts, embedding=embeddings, metadatas=metas)
    return db


# 4. Semantic Match Logic
def find_top_matches(db, query: str, top_k: int = 5):
    if db is None:
        return []

    try:
        # FAISS default is L2 distance (lower is better)
        results_with_scores = db.similarity_search_with_score(query, k=top_k)
        results = []

        for doc, raw_score in results_with_scores:
            # Simple conversion: L2 distance to a generic 0-100 score
            # Note: This is a rough heuristic. Lower L2 = Higher Similarity.
            # Assuming raw_score is L2 distance.
            similarity_score = max(0, 100 - (raw_score * 10))

            meta = doc.metadata
            results.append({
                "OEM": meta.get("OEM"),
                "Model": meta.get("Model"),
                "Product_Type": meta.get("Product_Type"),
                "Specs": meta.get("Specs"),
                "Semantic_Score": round(similarity_score, 2)
            })
        return results

    except Exception as e:
        print(f"Error in vector search: {e}")
        return []


# 5. Prompt Definition
TECH_PROMPT = PromptTemplate(
    input_variables=["product_name", "matches"],
    template=(
        "You are a TECHNICAL AGENT.\n"
        "Input RFP product: {product_name}\n\n"
        "Analyze the matches below and select the best fit based on specs.\n"
        "Matches (raw JSON list):\n{matches}\n\n"
        "Provide ONLY valid JSON output with the following keys:\n"
        " - RFP_Product (string)\n"
        " - Top_3_Recommendations (list of objects with OEM, Model, Product_Type, Specs, Semantic_Score)\n"
        " - Top_OEM (string: OEM of the highest Semantic_Score)\n\n"
        "Do not include Markdown formatting (like ```json). Return only the raw JSON string."
    )
)


# 6. Main Pipeline
def technical_agent_pipeline():
    print("Initializing Technical Agent...")
    llm = llm_model()

    # Load Data
    rfp = load_json(RFP_JSON_PATH)
    oems = load_json(OEM_JSON_PATH)  # Expecting a list of dicts directly, or a dict containing a list
    if isinstance(oems, dict) and "products" in oems: oems = oems["products"]

    # Build Vector DB
    db = build_faiss_index(oems)

    products_in_scope = rfp.get("Technical_Summary", {}).get("Products_In_Scope", [])
    results = []

    # Initialize Chain (Using LCEL)
    # Prompt -> LLM -> String Output Parser
    chain = TECH_PROMPT | llm | StrOutputParser()

    for product in products_in_scope:
        print(f"Processing RFP Requirement: {product}")

        # 1. Retrieve Matches
        matches = find_top_matches(db, product, top_k=5)
        matches_json = json.dumps(matches, indent=2, ensure_ascii=False, cls=NumpyEncoder)

        # 2. Generate Recommendations
        try:
            llm_output = chain.invoke({"product_name": product, "matches": matches_json})

            # Clean string if LLM adds markdown blocks
            clean_output = llm_output.replace("```json", "").replace("```", "").strip()
            parsed = json.loads(clean_output)

            result = {
                "RFP_Product": parsed.get("RFP_Product", product),
                "Top_3_Recommendations": parsed.get("Top_3_Recommendations", matches[:3]),
                "Top_OEM": parsed.get("Top_OEM", matches[0]["OEM"] if matches else "Unknown")
            }

        except json.JSONDecodeError:
            print("  - LLM JSON Error. Using deterministic fallback.")
            result = {
                "RFP_Product": product,
                "Top_3_Recommendations": matches[:3],
                "Top_OEM": matches[0]["OEM"] if matches else "Unknown",
                "Note": "Fallback due to LLM parsing error"
            }
        except Exception as e:
            print(f"  - Pipeline Error: {e}")
            result = {"RFP_Product": product, "Error": str(e)}

        results.append(result)

    # Output
    final_output = {"RFP_Technical_Recommendations": results}

    with open(OUTPUT_TECHNICAL_JSON, "w", encoding="utf-8") as f:
        json.dump(final_output, f, indent=2, ensure_ascii=False)

    print(f"Technical Agent done. Output saved to -> {OUTPUT_TECHNICAL_JSON}")
    return final_output


if __name__ == "__main__":
    technical_agent_pipeline()