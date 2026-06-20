from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import httpx
from datetime import datetime, timezone
from core.dependencies import get_current_user, get_project_or_404

router = APIRouter()

class MarketingWebhookRequest(BaseModel):
    type: str  # "individual" or "bulk"
    postIndex: Optional[int] = None
    image: Optional[str] = None  # base64 image

class WebsiteWebhookRequest(BaseModel):
    pass  # No body needed

@router.post("/{project_id}/webhook/marketing")
async def send_marketing_webhook(
    project_id: str,
    body: MarketingWebhookRequest,
    project=Depends(get_project_or_404),
    current_user=Depends(get_current_user)
):
    webhook_url = project.get("webhookUrl")
    if not webhook_url:
        raise HTTPException(status_code=400, detail="No webhook URL configured for this project")

    marketing_kit = project.get("marketingKit", [])
    if not marketing_kit:
        raise HTTPException(status_code=400, detail="No marketing kit generated yet")

    if body.type == "individual":
        if body.postIndex is None or body.postIndex >= len(marketing_kit):
            raise HTTPException(status_code=400, detail="Invalid post index")
        payload = marketing_kit[body.postIndex]
    else:
        payload = marketing_kit

    webhook_body = {
        "type": body.type,
        "payload": payload,
        "image": body.image,
        "projectName": project.get("name"),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(webhook_url, json=webhook_body)
            return {"sent": True, "status_code": response.status_code}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Webhook delivery failed: {str(e)}")

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
