import httpx
import logging
from datetime import datetime, timezone
from typing import List, Optional
from core.config import settings
from marketing_kit.services.imgbb import upload_to_imgbb

logger = logging.getLogger(__name__)


async def deploy(platform: str, caption: str, hashtags: List[str], image_url: Optional[str], session_id: str) -> dict:
    """Deploys one platform's post via the single n8n webhook (n8n's Switch node routes on `platform`)."""
    if settings.n8n_webhook_url == "dummy_url":
        return {"status": "skipped"}

    final_image_url = image_url
    if image_url and image_url.startswith("data:"):
        uploaded = await upload_to_imgbb(image_url)
        final_image_url = uploaded or image_url

    body = {
        "platform": platform,
        "caption": caption,
        "hashtags": hashtags,
        "image_url": final_image_url,
        "session_id": session_id,
        "posted_at": datetime.now(timezone.utc).isoformat(),
    }
    headers = {}
    if settings.n8n_deploy_secret:
        headers["X-Deploy-Secret"] = settings.n8n_deploy_secret

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(settings.n8n_webhook_url, json=body, headers=headers)
            return {"status": "deployed", "status_code": response.status_code}
    except Exception as e:
        logger.warning(f"n8n deploy failed for platform={platform}: {e}")
        return {"status": "error", "error": str(e)}
