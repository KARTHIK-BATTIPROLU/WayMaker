from agents.state import OrchestratorState
from services.search_service import fetch_real_world_context

async def web_search_node(state: OrchestratorState) -> dict:
    try:
        context = await fetch_real_world_context(state["idea"], state.get("industry"))
        return {
            "web_search_context": context,
            "current_step": "web_search",
            "completed_steps": state.get("completed_steps", []) + ["web_search"]
        }
    except Exception as e:
        return {
            "web_search_context": "",
            "current_step": "web_search",
            "completed_steps": state.get("completed_steps", []) + ["web_search"],
            "error": str(e)
        }
