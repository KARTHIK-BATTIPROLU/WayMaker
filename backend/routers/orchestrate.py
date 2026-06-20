from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from bson import ObjectId
import json
import asyncio
from agents.graph import orchestrator
from agents.state import OrchestratorState
from core.dependencies import get_current_user, get_project_or_404
from db.database import get_database

router = APIRouter()

STEP_MESSAGES = {
    "web_search": "Researching market with live web data...",
    "market_research": "Analyzing market size and opportunities...",
    "competitors": "Mapping the competitive landscape...",
    "website": "Designing your landing page...",
    "marketing": "Creating social media content...",
    "funding": "Matching funding opportunities..."
}

@router.post("/{project_id}/orchestrate")
async def run_orchestrator(
    project_id: str,
    project=Depends(get_project_or_404),
    current_user=Depends(get_current_user),
    db=Depends(get_database)
):
    async def event_stream():
        try:
            initial_state: OrchestratorState = {
                "project_id": project_id,
                "user_id": current_user["id"],
                "idea": project["idea"],
                "industry": project.get("industry"),
                "target_audience": project.get("targetAudience"),
                "location": project.get("location"),
                "web_search_context": None,
                "market_research": None,
                "competitors": None,
                "website_code": None,
                "marketing_kit": None,
                "funding": None,
                "current_step": "starting",
                "completed_steps": [],
                "error": None
            }

            # Send start event
            yield f"data: {json.dumps({'step': 'starting', 'status': 'running', 'message': 'Starting AI orchestration...'})}\n\n"
            await asyncio.sleep(0.1)

            # Stream LangGraph execution
            async for event in orchestrator.astream(initial_state):
                for node_name, state_update in event.items():
                    if node_name == "__end__":
                        continue

                    step = state_update.get("current_step", node_name)
                    message = STEP_MESSAGES.get(step, f"Processing {step}...")

                    # Build data payload based on step
                    data_payload = {"step": step, "status": "complete", "message": message}

                    if step == "web_search":
                        context = state_update.get("web_search_context", "")
                        result_count = len([l for l in context.split('\n') if l.startswith('- ')]) if context else 0
                        data_payload["resultCount"] = result_count

                    elif step == "market_research":
                        data_payload["data"] = state_update.get("market_research")

                    elif step == "competitors":
                        competitors = state_update.get("competitors", [])
                        data_payload["data"] = competitors
                        data_payload["count"] = len(competitors)

                    elif step == "website":
                        data_payload["hasWebsite"] = bool(state_update.get("website_code"))

                    elif step == "marketing":
                        kit = state_update.get("marketing_kit", [])
                        data_payload["platforms"] = [p.get("platform") for p in kit]

                    elif step == "funding":
                        funding = state_update.get("funding", [])
                        data_payload["count"] = len(funding)

                    yield f"data: {json.dumps(data_payload)}\n\n"
                    await asyncio.sleep(0.05)

            # Final completion event
            yield f"data: {json.dumps({'step': 'complete', 'status': 'done', 'message': 'All done! Your business foundation is ready.'})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'step': 'error', 'status': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Access-Control-Allow-Origin": "*"
        }
    )
