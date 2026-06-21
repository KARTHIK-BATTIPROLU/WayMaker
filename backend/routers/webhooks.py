from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import httpx
from datetime import datetime, timezone
from core.dependencies import get_current_user, get_project_or_404

router = APIRouter()

class WebsiteWebhookRequest(BaseModel):
    pass  # No body needed

@router.post("/{project_id}/webhook/website")
async def send_website_webhook(
    project_id: str,
    project=Depends(get_project_or_404),
    current_user=Depends(get_current_user)
):
    zapier_url = project.get("zapierWebhookUrl")
    if not zapier_url:
        raise HTTPException(status_code=400, detail="No Zapier webhook URL configured")

    website_code = project.get("websiteCode")
    if not website_code:
        raise HTTPException(status_code=400, detail="No website code generated yet")

    payload = {
        "projectName": project.get("name"),
        "websiteCode": website_code,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(zapier_url, json=payload)
            return {"sent": True, "status_code": response.status_code}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Zapier webhook failed: {str(e)}")
