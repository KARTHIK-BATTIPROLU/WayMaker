import asyncio
import logging
from datetime import datetime, timezone
from typing import List, Optional
from bson import ObjectId
from bson.errors import InvalidId
from marketing_kit import store
from marketing_kit.services.groq_service import generate_post, generate_platform_kit
from marketing_kit.services.image_service import generate_images
from db.database import get_database

logger = logging.getLogger(__name__)


async def _mark_project_kit_generated(project_id: Optional[str]) -> None:
    """Flips Project.marketingKitGenerated so the dashboard's Modules list can show it as done."""
    if not project_id:
        return
    try:
        db = get_database()
        await db.projects.update_one(
            {"_id": ObjectId(project_id)},
            {"$set": {"marketingKitGenerated": True, "updatedAt": datetime.now(timezone.utc)}},
        )
    except InvalidId:
        logger.warning(f"Skipping marketingKitGenerated flag: invalid project_id {project_id!r}")


async def run_pipeline(session_id: str, user_input: str, preferences: str, brand_asset_url: Optional[str] = None, project_id: Optional[str] = None) -> None:
    """LinkedIn single-post pipeline: idea -> caption/hashtags -> images -> preview."""
    try:
        await store.update_session(session_id, {"status": "generating_post"})
        post = await generate_post(user_input, preferences)
        await asyncio.sleep(0.5)

        await store.update_session(session_id, {
            "status": "generating_images",
            "post_text": post["post_text"],
            "hashtags": post["hashtags"],
            "image_prompt": post["image_prompt"],
        })
        image_urls = await generate_images(post["image_prompt"], count=3, platform="linkedin", brand_asset_url=brand_asset_url)
        await asyncio.sleep(0.5)

        await store.update_session(session_id, {
            "status": "preview",
            "image_urls": image_urls,
            "approved": False,
        })
        await _mark_project_kit_generated(project_id)
    except Exception as e:
        logger.exception("run_pipeline failed")
        await store.update_session(session_id, {"status": "error", "error": str(e)})


async def run_platform_pipeline(
    session_id: str, user_input: str, target_platforms: List[str], preferences: str,
    brand_asset_url: Optional[str] = None, project_id: Optional[str] = None,
) -> None:
    """Multi-platform pipeline: idea -> per-platform kit (caption/hashtags/image) -> platform_preview."""
    try:
        await store.update_session(session_id, {"status": "generating_kit"})
        kit = await generate_platform_kit(user_input, target_platforms, preferences)
        await asyncio.sleep(0.5)

        await store.update_session(session_id, {"status": "generating_images", "marketing_kit": kit})

        async def fill_images(item: dict) -> dict:
            urls = await generate_images(item["image_prompt"], count=1, platform=item["platform"], brand_asset_url=brand_asset_url)
            return {**item, "image_url": urls[0] if urls else None}

        kit_with_images = await asyncio.gather(*[fill_images(item) for item in kit])
        await asyncio.sleep(0.5)

        await store.update_session(session_id, {
            "status": "platform_preview",
            "marketing_kit": list(kit_with_images),
        })
        await _mark_project_kit_generated(project_id)
    except Exception as e:
        logger.exception("run_platform_pipeline failed")
        await store.update_session(session_id, {"status": "error", "error": str(e)})


async def regenerate_post_text(session_id: str, user_input: str, preferences: str) -> None:
    try:
        await store.update_session(session_id, {"status": "generating_post"})
        post = await generate_post(user_input, preferences)
        await store.update_session(session_id, {
            "status": "preview",
            "post_text": post["post_text"],
            "hashtags": post["hashtags"],
        })
    except Exception as e:
        logger.exception("regenerate_post_text failed")
        await store.update_session(session_id, {"status": "error", "error": str(e)})


async def regenerate_session_images(session_id: str, image_prompt: str) -> None:
    try:
        await store.update_session(session_id, {"status": "generating_images"})
        image_urls = await generate_images(image_prompt, count=3, platform="linkedin")
        await store.update_session(session_id, {"status": "preview", "image_urls": image_urls})
    except Exception as e:
        logger.exception("regenerate_session_images failed")
        await store.update_session(session_id, {"status": "error", "error": str(e)})
