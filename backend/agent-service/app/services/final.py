import json
from langgraph.graph import StateGraph, END

# Import the actual agent pipelines (assuming these load/run the agents and save files)
from main_agent_module import main_agent_pipeline
from technical_agent_module import technical_agent_pipeline
from pricing_agent_module import pricing_agent_llm_pipeline

# --- CONFIG ---
# Define the paths where the downstream agents will save their outputs
RFP_JSON_PATH = "./lib/reports/rfp_summary.json"
TECH_OUTPUT_PATH = "./lib/reports/technical_agent_output.json"
OUTPUT_PRICING_JSON = "./lib/reports/pricing_agent_output.json"
FINAL_RESPONSE_PATH = "./lib/reports/final_rfp_response.json"


# === STATE FLOW NODES ===
# In a robust LangGraph flow, you would usually pass inputs into the first node.
# Since your agent modules handle file I/O internally, we'll keep the calls but ensure
# they write the output paths to the state for the merge step.

def load_json_safe(path: str) -> dict:
    """Helper to safely load JSON output files."""
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Warning: Could not load JSON from {path}. Error: {e}")
        return {}


def run_main_agent(state: dict) -> dict:
    """Runs Main Agent and reads/saves the RFP summary to state."""
    print("\n🚀 Running Main Agent...")
    # This function is expected to run the agent and save the output to RFP_JSON_PATH
    main_agent_pipeline()

    # Load the output file and store its content in the state
    rfp_output = load_json_safe(RFP_JSON_PATH)
    state["rfp_summary"] = rfp_output
    return state


def run_technical_agent(state: dict) -> dict:
    """Runs Technical Agent and reads/saves the technical recommendations to state."""
    print("\n⚙️ Running Technical Agent...")
    # This function is expected to run the agent and save the output to TECH_OUTPUT_PATH
    technical_agent_pipeline()

    # Load the output file and store its content in the state
    tech_output = load_json_safe(TECH_OUTPUT_PATH)
    state["technical_output"] = tech_output
    return state


def run_pricing_agent(state: dict) -> dict:
    """Runs Pricing Agent and reads/saves the pricing output to state."""
    print("\n💰 Running Pricing Agent (LLM-driven)...")
    # This function is expected to run the agent and save the output to OUTPUT_PRICING_JSON
    pricing_agent_llm_pipeline()

    # Load the output file and store its content in the state
    price_output = load_json_safe(OUTPUT_PRICING_JSON)
    state["pricing_output"] = price_output
    return state


def merge_results(state: dict) -> dict:
    """Consolidates results from state and saves the final JSON response."""
    print("\n📦 Consolidating Final Output...")

    # Extract data directly from the state dictionary
    rfp_summary = state.get("rfp_summary", {})
    technical_output = state.get("technical_output", {})
    pricing_output = state.get("pricing_output", {})

    # Safely construct the final response structure
    final_response = {
        "RFP_Metadata": rfp_summary.get("RFP_Metadata", {}),
        # Extract the core lists/values from the agent outputs
        "Technical_Recommendations": technical_output.get("RFP_Technical_Recommendations", []),
        "Pricing_Summary": pricing_output.get("Pricing_Summary", []),
        "Grand_Total_INR": pricing_output.get("Grand_Total_INR", 0)
    }

    with open(FINAL_RESPONSE_PATH, "w", encoding="utf-8") as f:
        json.dump(final_response, f, indent=2, ensure_ascii=False)

    print(f"✅ Final RFP Response Saved: {FINAL_RESPONSE_PATH}")
    return state


## 🏗️ Graph Definition


def build_orchestral_flow():
    # We define the StateGraph where the state is a dictionary
    workflow = StateGraph(dict)

    workflow.add_node("Main_Agent", run_main_agent)
    workflow.add_node("Technical_Agent", run_technical_agent)
    workflow.add_node("Pricing_Agent", run_pricing_agent)
    workflow.add_node("Merge_Output", merge_results)

    # Define the sequential execution path
    workflow.set_entry_point("Main_Agent")
    workflow.add_edge("Main_Agent", "Technical_Agent")
    workflow.add_edge("Technical_Agent", "Pricing_Agent")
    workflow.add_edge("Pricing_Agent", "Merge_Output")
    workflow.add_edge("Merge_Output", END)

    return workflow


# === ENTRY POINT ===
if __name__ == "__main__":
    import os

    print("Current working directory:", os.getcwd())
    print("\n🎯 Starting LangGraph Orchestral Flow...")

    graph = build_orchestral_flow()
    executor = graph.compile()

    # The executor's input is an empty dictionary for the initial state
    final_state = executor.invoke({})
    print("\n🏁 Workflow completed successfully.")
    # Optional: Print the final state contents
    # print("\nFinal State Keys:", final_state.keys())
    # print("Final RFP Summary:", final_state.get('rfp_summary', {}).get('RFP_Metadata'))