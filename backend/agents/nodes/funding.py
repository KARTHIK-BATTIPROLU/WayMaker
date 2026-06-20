import json
from agents.state import OrchestratorState
from agents.prompts import FUNDING_SYSTEM
from services.groq_service import groq_chat, extract_json
from db.database import get_database
from bson import ObjectId
from datetime import datetime, timezone

async def funding_node(state: OrchestratorState) -> dict:
    try:
        user_message = f"""Business Idea: {state['idea']}
Industry: {state.get('industry', 'Technology')}
Target Audience: {state.get('target_audience', 'Not specified')}
Location: {state.get('location', 'Global')}
Stage: Early stage / MVP

Find the best matching funding opportunities for this business."""

        response = await groq_chat(
            messages=[
                {"role": "system", "content": FUNDING_SYSTEM},
                {"role": "user", "content": user_message}
            ],
            max_tokens=3000,
            temperature=1.0
        )

        clean_json = extract_json(response)
        funding = json.loads(clean_json)
        if not isinstance(funding, list):
            funding = []

        db = get_database()
        await db.projects.update_one(
            {"_id": ObjectId(state["project_id"])},
            {"$set": {"fundingOpportunities": funding, "updatedAt": datetime.now(timezone.utc)}}
        )

        return {
            "funding": funding,
            "current_step": "funding",
            "completed_steps": state.get("completed_steps", []) + ["funding"]
        }
    except Exception as e:
        return {
            "funding": [],
            "current_step": "funding",
            "completed_steps": state.get("completed_steps", []) + ["funding"],
            "error": f"Funding failed: {str(e)}"
        }
