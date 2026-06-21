import json
import logging
from agents.state import OrchestratorState
from agents.prompts import MARKET_INTELLIGENCE_SYSTEM, RESEARCH_DISCLAIMER
from agents.context import build_research_context, context_as_prompt_block
from agents.validators import run_with_validation
from services.groq_service import groq_chat, extract_json
from services.search_service import serper_search_structured, trends_signal
from db.database import get_database
from bson import ObjectId
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


async def _gather(state: OrchestratorState, context: dict) -> str:
    """Deterministic Serper gather: reuse web_search_context + a few targeted queries
    (segments / funding climate / demand trend), bounded by the research budget."""
    budget = context["research_budget"]
    idea = state["idea"]
    industry = state.get("industry") or ""

    segment_results = await serper_search_structured(f"{idea} {industry} target customer segments India".strip(), num_results=5) \
        if budget.can_search() else []
    if segment_results:
        budget.note_search()

    funding_results = await serper_search_structured(f"{industry or idea} startup funding investment India 2025".strip(), num_results=5) \
        if budget.can_search() else []
    if funding_results:
        budget.note_search()

    trend = await trends_signal(f"{industry or idea}", budget)

    lines = ["--- GATHERED RESEARCH CONTEXT ---", state.get("web_search_context") or "(no prior web search context)"]
    if segment_results:
        lines.append("\nSegment signals:")
        lines += [f"- {r['title']} ({r['url']}): {r['snippet']}" for r in segment_results]
    if funding_results:
        lines.append("\nFunding climate signals:")
        lines += [f"- {r['title']} ({r['url']}): {r['snippet']}" for r in funding_results]
    if trend["snippets"]:
        lines.append(f"\nDemand trend proxy ({trend['source']}, {trend['result_count']} results):")
        lines += [f"- {s}" for s in trend["snippets"]]
    lines.append("--- END GATHERED RESEARCH CONTEXT ---")
    return "\n".join(lines)


async def market_research_node(state: OrchestratorState) -> dict:
    try:
        db = get_database()
        project = await db.projects.find_one({"_id": ObjectId(state["project_id"])}) or {}
        context = build_research_context(project)
        gathered = await _gather(state, context)

        async def synthesize(prompt_suffix: str) -> dict:
            user_message = f"""{context_as_prompt_block(context)}

{gathered}

DISCLAIMER TO ECHO VERBATIM IN YOUR OUTPUT: {RESEARCH_DISCLAIMER}

Generate the market_intelligence.v1 report for this business idea.{prompt_suffix}"""
            response = await groq_chat(
                messages=[
                    {"role": "system", "content": MARKET_INTELLIGENCE_SYSTEM},
                    {"role": "user", "content": user_message},
                ],
                model="llama-3.3-70b-versatile",
                max_tokens=4096,
                temperature=1.0,
            )
            return json.loads(extract_json(response))

        market_data, status = await run_with_validation(synthesize, "market")

        db_update: dict = {"marketResearch": market_data, "updatedAt": datetime.now(timezone.utc)}
        await db.projects.update_one({"_id": ObjectId(state["project_id"])}, {"$set": db_update})

        return {
            "market_research": market_data,
            "current_step": "market_research",
            "completed_steps": state.get("completed_steps", []) + ["market_research"],
            "error": None if status == "ok" else f"market_research persisted as partial (validation blocks: {market_data.get('flags')})",
        }
    except Exception as e:
        logger.exception("market_research_node failed")
        return {
            "market_research": None,
            "current_step": "market_research",
            "completed_steps": state.get("completed_steps", []) + ["market_research"],
            "error": f"Market research failed: {str(e)}",
        }
