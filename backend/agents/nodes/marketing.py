import json
from agents.state import OrchestratorState
from agents.prompts import MARKETING_SYSTEM
from services.groq_service import groq_chat, extract_json
from db.database import get_database
from bson import ObjectId
from datetime import datetime, timezone

async def marketing_node(state: OrchestratorState) -> dict:
    try:
        competitors = state.get("competitors", [])
        competitor_names = [c.get("name", "") for c in competitors[:3]] if competitors else []
        competitor_intel = f"Key competitors: {', '.join(competitor_names)}" if competitor_names else ""

        user_message = f"""Business Idea: {state['idea']}
Industry: {state.get('industry', 'Not specified')}
Target Audience: {state.get('target_audience', 'Not specified')}
Location: {state.get('location', 'Global')}
{competitor_intel}

Create platform-optimized social media content for all 4 platforms."""

        response = await groq_chat(
            messages=[
                {"role": "system", "content": MARKETING_SYSTEM},
                {"role": "user", "content": user_message}
            ],
            max_tokens=3000,
            temperature=1.0
        )

        clean_json = extract_json(response)
        marketing_kit = json.loads(clean_json)
        if not isinstance(marketing_kit, list):
            marketing_kit = []

        db = get_database()
        await db.projects.update_one(
            {"_id": ObjectId(state["project_id"])},
            {"$set": {"marketingKit": marketing_kit, "updatedAt": datetime.now(timezone.utc)}}
        )

        return {
            "marketing_kit": marketing_kit,
            "current_step": "marketing",
            "completed_steps": state.get("completed_steps", []) + ["marketing"]
        }
    except Exception as e:
        return {
            "marketing_kit": [],
            "current_step": "marketing",
            "completed_steps": state.get("completed_steps", []) + ["marketing"],
            "error": f"Marketing failed: {str(e)}"
        }
