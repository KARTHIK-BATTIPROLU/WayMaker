from agents.state import OrchestratorState
from services.website_service import build_website_prompt, groq_generate_website
from db.database import get_database
from bson import ObjectId
from datetime import datetime, timezone

async def website_node(state: OrchestratorState) -> dict:
    try:
        prompt = build_website_prompt(state['idea'], state.get('industry'), state.get('location'))
        html_code = await groq_generate_website(prompt)

        db = get_database()
        await db.projects.update_one(
            {"_id": ObjectId(state["project_id"])},
            {"$set": {"websiteCode": html_code, "updatedAt": datetime.now(timezone.utc)}}
        )

        return {
            "website_code": html_code,
            "current_step": "website",
            "completed_steps": state.get("completed_steps", []) + ["website"]
        }
    except Exception as e:
        return {
            "website_code": None,
            "current_step": "website",
            "completed_steps": state.get("completed_steps", []) + ["website"],
            "error": f"Website failed: {str(e)}"
        }
