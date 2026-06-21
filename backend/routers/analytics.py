from fastapi import APIRouter, Depends
import json
from bson import ObjectId
from datetime import datetime, timezone
from services.search_service import serper_search
from services.groq_service import groq_chat, extract_json
from agents.prompts import COMPETITOR_ANALYTICS_SYSTEM
from core.dependencies import get_current_user, get_project_or_404
from db.database import get_database

router = APIRouter()

@router.post("/{project_id}/analytics")
async def analyze_competitor_socials(
    project_id: str,
    project=Depends(get_project_or_404),
    current_user=Depends(get_current_user),
    db=Depends(get_database)
):
    competitors_field = project.get("competitors")
    if isinstance(competitors_field, dict):
        competitors = competitors_field.get("competitors", [])[:3]
    elif isinstance(competitors_field, list):
        competitors = competitors_field[:3]
    else:
        competitors = []
    if not competitors:
        return {"analytics": [], "message": "No competitors to analyze"}

    all_search_data = []
    platforms = ["Instagram", "LinkedIn", "Twitter"]

    for competitor in competitors:
        name = competitor.get("name", "")
        for platform in platforms:
            query = f"{name} {platform} social media marketing strategy"
            results = await serper_search(query, num_results=3)
            all_search_data.append(f"## {name} on {platform}\n{results}")

    combined_data = "\n\n".join(all_search_data)

    try:
        response = await groq_chat(
            messages=[
                {"role": "system", "content": COMPETITOR_ANALYTICS_SYSTEM},
                {"role": "user", "content": f"Analyze this competitor social media data:\n\n{combined_data}\n\nReturn JSON analytics array with insights per competitor."}
            ],
            max_tokens=3000,
            temperature=0.7
        )
        clean_json = extract_json(response)
        analytics = json.loads(clean_json)
        if not isinstance(analytics, list):
            analytics = [{"raw": response}]
    except Exception as e:
        analytics = [{"error": str(e), "rawData": combined_data[:500]}]

    await db.projects.update_one(
        {"_id": ObjectId(project_id)},
        {"$set": {"competitorAnalytics": analytics, "updatedAt": datetime.now(timezone.utc)}}
    )

    return {"analytics": analytics}
