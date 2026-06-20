import json
from agents.state import OrchestratorState
from agents.prompts import MARKET_RESEARCH_SYSTEM
from services.groq_service import groq_chat, extract_json
from db.database import get_database
from bson import ObjectId
from datetime import datetime, timezone

async def market_research_node(state: OrchestratorState) -> dict:
    try:
        web_context = state.get("web_search_context", "")
        user_message = f"""Business Idea: {state['idea']}
Industry: {state.get('industry', 'Not specified')}
Target Audience: {state.get('target_audience', 'Not specified')}
Location: {state.get('location', 'Global')}

{web_context}

Generate comprehensive market research for this business idea."""

        response = await groq_chat(
            messages=[
                {"role": "system", "content": MARKET_RESEARCH_SYSTEM},
                {"role": "user", "content": user_message}
            ],
            max_tokens=4096,
            temperature=1.0
        )

        clean_json = extract_json(response)
        market_data = json.loads(clean_json)

        # Save to MongoDB immediately
        db = get_database()
        await db.projects.update_one(
            {"_id": ObjectId(state["project_id"])},
            {"$set": {"marketResearch": market_data, "updatedAt": datetime.now(timezone.utc)}}
        )

        return {
            "market_research": market_data,
            "current_step": "market_research",
            "completed_steps": state.get("completed_steps", []) + ["market_research"]
        }
    except Exception as e:
        return {
            "market_research": None,
            "current_step": "market_research",
            "completed_steps": state.get("completed_steps", []) + ["market_research"],
            "error": f"Market research failed: {str(e)}"
        }
