import json
from agents.state import OrchestratorState
from agents.prompts import COMPETITORS_SYSTEM
from services.groq_service import groq_chat, extract_json
from db.database import get_database
from bson import ObjectId
from datetime import datetime, timezone

async def competitors_node(state: OrchestratorState) -> dict:
    try:
        user_message = f"""Business Idea: {state['idea']}
Industry: {state.get('industry', 'Not specified')}
Target Audience: {state.get('target_audience', 'Not specified')}
Location: {state.get('location', 'Global')}

Identify the top 5 real competitors for this business."""

        response = await groq_chat(
            messages=[
                {"role": "system", "content": COMPETITORS_SYSTEM},
                {"role": "user", "content": user_message}
            ],
            max_tokens=2048,
            temperature=1.0
        )

        clean_json = extract_json(response)
        competitors = json.loads(clean_json)
        if not isinstance(competitors, list):
            competitors = []

        db = get_database()
        await db.projects.update_one(
            {"_id": ObjectId(state["project_id"])},
            {"$set": {"competitors": competitors, "updatedAt": datetime.now(timezone.utc)}}
        )

        return {
            "competitors": competitors,
            "current_step": "competitors",
            "completed_steps": state.get("completed_steps", []) + ["competitors"]
        }
    except Exception as e:
        return {
            "competitors": [],
            "current_step": "competitors",
            "completed_steps": state.get("completed_steps", []) + ["competitors"],
            "error": f"Competitors failed: {str(e)}"
        }
