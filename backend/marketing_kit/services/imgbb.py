import httpx
import logging
from core.config import settings

logger = logging.getLogger(__name__)

IMGBB_UPLOAD_URL = "https://api.imgbb.com/1/upload"


async def upload_to_imgbb(image_base64: str) -> str | None:
    """Uploads a base64-encoded image to ImgBB and returns its public URL, or None in dummy mode/on failure."""
    if not settings.imgbb_api_key or settings.imgbb_api_key == "dummy":
        return None
    # Strip a data URL prefix if present (e.g. "data:image/png;base64,....")
    payload = image_base64.split(",", 1)[1] if image_base64.startswith("data:") else image_base64
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                IMGBB_UPLOAD_URL,
                params={"key": settings.imgbb_api_key},
                data={"image": payload},
            )
            response.raise_for_status()
            data = response.json()
            return data.get("data", {}).get("url")
    except Exception as e:
        logger.warning(f"ImgBB upload failed: {e}")
        return None
