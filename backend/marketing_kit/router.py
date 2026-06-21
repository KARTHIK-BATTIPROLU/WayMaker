from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Header
from pymongo.errors import DuplicateKeyError
import asyncio
from core.dependencies import get_current_user
from core.config import settings
from marketing_kit import store
from marketing_kit.models import (
    RunRequest, PlatformRunRequest, ActionRequest, EditRequest, PreferencesUpdate,
    DeployRequest, SourceCreate, PermanentAddRequest, ConfigUpdate, GenerateFromTopicRequest,
    AssetUploadRequest,
)
from marketing_kit.pipelines import run_pipeline, run_platform_pipeline, regenerate_post_text, regenerate_session_images
from marketing_kit.services.n8n_service import deploy as n8n_deploy
from marketing_kit.services.imgbb import upload_to_imgbb
from marketing_kit.calendar.jobs import run_daily_refresh

router = APIRouter()


# ── Ported generation/deploy routes (CONTEXT §6.1) ──────────────────────────

@router.post("/upload-asset")
async def upload_asset(body: AssetUploadRequest, current_user=Depends(get_current_user)):
    url = await upload_to_imgbb(body.image_base64)
    if not url:
        raise HTTPException(status_code=502, detail="Asset upload failed. Check that IMGBB_API_KEY is configured.")
    return {"url": url}


@router.post("/run")
async def run(body: RunRequest, background_tasks: BackgroundTasks, current_user=Depends(get_current_user)):
    preferences = await store.get_preferences()
    session_id = await store.create_session({
        "mode": "linkedin",
        "user_input": body.user_input,
        "preferences": preferences,
        "post_text": None,
        "hashtags": [],
        "image_urls": [],
        "status": "starting",
        "approved": False,
        "error": None,
        "origin": body.origin,
        "topic_id": body.topic_id,
        "brand_asset_url": body.brand_asset_url,
        "project_id": body.project_id,
        "deploy_results": {},
    })
    background_tasks.add_task(run_pipeline, session_id, body.user_input, preferences, body.brand_asset_url, body.project_id)
    return {"session_id": session_id}


@router.post("/run_platform")
async def run_platform(body: PlatformRunRequest, background_tasks: BackgroundTasks, current_user=Depends(get_current_user)):
    preferences = await store.get_preferences()
    session_id = await store.create_session({
        "mode": "platform",
        "user_input": body.user_input,
        "target_platforms": body.target_platforms,
        "marketing_kit": [],
        "status": "starting",
        "error": None,
        "origin": body.origin,
        "topic_id": body.topic_id,
        "brand_asset_url": body.brand_asset_url,
        "project_id": body.project_id,
        "deploy_results": {},
    })
    background_tasks.add_task(run_platform_pipeline, session_id, body.user_input, body.target_platforms, preferences, body.brand_asset_url, body.project_id)
    return {"session_id": session_id}


@router.get("/state/{session_id}")
async def get_state(session_id: str, current_user=Depends(get_current_user)):
    session = await store.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.post("/action/{session_id}")
async def action(session_id: str, body: ActionRequest, background_tasks: BackgroundTasks, current_user=Depends(get_current_user)):
    session = await store.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if body.action == "approve":
        await store.update_session(session_id, {"approved": True})
    elif body.action == "regenerate_post":
        if session.get("mode") != "linkedin":
            raise HTTPException(status_code=400, detail="regenerate_post only applies to LinkedIn sessions")
        background_tasks.add_task(regenerate_post_text, session_id, session["user_input"], session["preferences"])
    elif body.action == "regenerate_images":
        if session.get("mode") != "linkedin":
            raise HTTPException(status_code=400, detail="regenerate_images only applies to LinkedIn sessions")
        background_tasks.add_task(regenerate_session_images, session_id, session.get("image_prompt") or session["user_input"])

    return await store.get_session(session_id)


@router.post("/edit/{session_id}")
async def edit(session_id: str, body: EditRequest, current_user=Depends(get_current_user)):
    session = await store.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    await store.update_session(session_id, {"post_text": body.post_text, "edit_post_text": body.post_text})
    return {"status": "success"}


@router.post("/deploy/{session_id}")
async def deploy_one(session_id: str, body: DeployRequest, current_user=Depends(get_current_user)):
    session = await store.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.get("mode") == "linkedin":
        caption, hashtags = session.get("post_text", ""), session.get("hashtags", [])
        image_urls = session.get("image_urls", [])
        image_url = image_urls[0] if image_urls else None
    else:
        kit = session.get("marketing_kit", [])
        item = next((k for k in kit if k["platform"].lower() == body.platform.lower()), None)
        if not item:
            raise HTTPException(status_code=404, detail=f"No kit entry for platform '{body.platform}'")
        caption, hashtags, image_url = item.get("content", ""), item.get("hashtags", []), item.get("image_url")

    result = await n8n_deploy(body.platform, caption, hashtags, image_url, session_id)
    deploy_results = {**session.get("deploy_results", {}), body.platform: result}
    await store.update_session(session_id, {"deploy_results": deploy_results})
    return {"status": result["status"], "platform": body.platform, "response": result}


@router.post("/deploy-all/{session_id}")
async def deploy_all(session_id: str, current_user=Depends(get_current_user)):
    session = await store.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.get("mode") == "linkedin":
        image_urls = session.get("image_urls", [])
        targets = [("linkedin", session.get("post_text", ""), session.get("hashtags", []), image_urls[0] if image_urls else None)]
    else:
        kit = session.get("marketing_kit", [])
        targets = [(k["platform"], k.get("content", ""), k.get("hashtags", []), k.get("image_url")) for k in kit]

    results = await asyncio.gather(*[n8n_deploy(platform, caption, hashtags, image_url, session_id) for platform, caption, hashtags, image_url in targets])
    deploy_results = {**session.get("deploy_results", {}), **{platform: result for (platform, *_rest), result in zip(targets, results)}}
    await store.update_session(session_id, {"deploy_results": deploy_results})
    return {"status": "deployed", "results": deploy_results}


@router.get("/preferences")
async def get_preferences(current_user=Depends(get_current_user)):
    return {"content": await store.get_preferences()}


@router.put("/preferences")
async def update_preferences(body: PreferencesUpdate, current_user=Depends(get_current_user)):
    await store.set_preferences(body.content)
    return {"status": "updated"}


# ── Content Calendar routes (CONTEXT §6.2) ──────────────────────────────────

@router.get("/calendar/today")
async def calendar_today(current_user=Depends(get_current_user)):
    return await store.get_today_topics()


@router.get("/calendar/permanent")
async def calendar_permanent(current_user=Depends(get_current_user)):
    return await store.list_permanent()


@router.post("/calendar/permanent")
async def calendar_permanent_add(body: PermanentAddRequest, current_user=Depends(get_current_user)):
    if body.topic_id:
        topic = await store.get_topic_by_id(body.topic_id)
        if not topic:
            raise HTTPException(status_code=404, detail="Topic not found")
    elif body.title:
        topic = body.model_dump()
    else:
        raise HTTPException(status_code=400, detail="topic_id or a full topic (title) is required")

    try:
        return await store.add_permanent(topic, source_daily_topic_id=body.topic_id)
    except DuplicateKeyError:
        raise HTTPException(status_code=409, detail="This topic is already in the Permanent list")


@router.delete("/calendar/permanent/{topic_id}")
async def calendar_permanent_delete(topic_id: str, current_user=Depends(get_current_user)):
    if not await store.delete_permanent(topic_id):
        raise HTTPException(status_code=404, detail="Topic not found")
    return {"status": "deleted"}


@router.get("/calendar/sources")
async def calendar_sources(current_user=Depends(get_current_user)):
    return await store.list_sources()


@router.post("/calendar/sources")
async def calendar_sources_add(body: SourceCreate, current_user=Depends(get_current_user)):
    return await store.create_source(body.model_dump())


@router.delete("/calendar/sources/{source_id}")
async def calendar_sources_delete(source_id: str, current_user=Depends(get_current_user)):
    if not await store.delete_source(source_id):
        raise HTTPException(status_code=404, detail="Source not found")
    return {"status": "deleted"}


@router.get("/calendar/config")
async def calendar_config_get(current_user=Depends(get_current_user)):
    return await store.get_config()


@router.put("/calendar/config")
async def calendar_config_update(body: ConfigUpdate, current_user=Depends(get_current_user)):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    return await store.update_config(updates)


@router.post("/calendar/refresh")
async def calendar_refresh(x_refresh_secret: str = Header(default="")):
    """Secret-gated endpoint for the n8n Schedule Trigger (no user session involved)."""
    if x_refresh_secret != settings.n8n_schedule_secret:
        raise HTTPException(status_code=401, detail="Invalid or missing X-Refresh-Secret")
    return await run_daily_refresh()


@router.post("/calendar/refresh-now")
async def calendar_refresh_now(current_user=Depends(get_current_user)):
    """JWT-gated twin of /calendar/refresh for the UI's manual 'Refresh now' button."""
    return await run_daily_refresh()


@router.post("/calendar/generate")
async def calendar_generate(body: GenerateFromTopicRequest, background_tasks: BackgroundTasks, current_user=Depends(get_current_user)):
    topic = await store.get_topic_by_id(body.topic_id)
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    user_input = f"{topic['title']}. {topic.get('description', '')}".strip()
    preferences = await store.get_preferences()

    if body.mode == "linkedin":
        session_id = await store.create_session({
            "mode": "linkedin",
            "user_input": user_input,
            "preferences": preferences,
            "post_text": None,
            "hashtags": [],
            "image_urls": [],
            "status": "starting",
            "approved": False,
            "error": None,
            "origin": "calendar",
            "topic_id": body.topic_id,
            "deploy_results": {},
        })
        background_tasks.add_task(run_pipeline, session_id, user_input, preferences)
    else:
        target_platforms = body.target_platforms or ["LinkedIn", "Twitter", "Instagram"]
        session_id = await store.create_session({
            "mode": "platform",
            "user_input": user_input,
            "target_platforms": target_platforms,
            "marketing_kit": [],
            "status": "starting",
            "error": None,
            "origin": "calendar",
            "topic_id": body.topic_id,
            "deploy_results": {},
        })
        background_tasks.add_task(run_platform_pipeline, session_id, user_input, target_platforms, preferences)

    await store.mark_topic_used(body.topic_id)
    return {"session_id": session_id}
