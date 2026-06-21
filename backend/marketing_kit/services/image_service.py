import asyncio
import logging
from typing import List, Optional
import replicate
from core.config import settings

logger = logging.getLogger(__name__)

MODEL = "black-forest-labs/flux-2-pro"

ASPECT_RATIO_BY_PLATFORM = {
    "instagram": "1:1",
    "linkedin": "16:9",
    "twitter": "16:9",
    "x": "16:9",
    "facebook": "16:9",
}


def _aspect_ratio_for(platform: str) -> str:
    return ASPECT_RATIO_BY_PLATFORM.get(platform.lower(), "16:9")


async def _generate_one(client: replicate.Client, prompt: str, aspect_ratio: str, brand_asset_url: Optional[str]) -> str | None:
    try:
        run_input = {"prompt": prompt, "aspect_ratio": aspect_ratio}
        if brand_asset_url:
            # FLUX.2 Pro takes up to 8 reference images via numbered input_image_N fields.
            run_input["input_image_1"] = brand_asset_url
        output = await client.async_run(MODEL, input=run_input)
        if isinstance(output, list):
            return str(output[0]) if output else None
        return str(output) if output else None
    except Exception as e:
        logger.warning(f"Image generation failed: {e}")
        return None


async def generate_images(prompt: str, count: int = 3, platform: str = "linkedin", brand_asset_url: Optional[str] = None) -> List[str]:
    """Returns a list of image URLs (Replicate's hosted output URLs). Empty list in dummy mode or on failure.
    When brand_asset_url is set, it's passed as a reference image so generations stay visually on-brand."""
    if not settings.replicate_api_token or settings.replicate_api_token == "dummy":
        return []
    client = replicate.Client(api_token=settings.replicate_api_token)
    aspect_ratio = _aspect_ratio_for(platform)
    results = await asyncio.gather(*[_generate_one(client, prompt, aspect_ratio, brand_asset_url) for _ in range(count)])
    return [url for url in results if url]
