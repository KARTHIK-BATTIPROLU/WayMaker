import json
import logging
from agents.state import OrchestratorState
from agents.prompts import CUSTOMER_DISCOVERY_SYSTEM, RESEARCH_DISCLAIMER
from agents.context import build_research_context, context_as_prompt_block
from agents.validators import run_with_validation
from services.groq_service import groq_chat, extract_json
from services.search_service import serper_search_structured, verify_url
from db.database import get_database
from bson import ObjectId
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

COMMUNITY_QUERY_TEMPLATES = [
    "{customer} reddit community",
    "{customer} forum discussion",
    "{industry} Facebook group India",
    "{customer} subreddit",
    "{industry} Discord server",
    "{industry} LinkedIn group India",
]

DIRECTORY_QUERY_TEMPLATES = [
    "{industry} startup directory India",
    "{industry} tools Product Hunt",
]


async def _discover_verified(query_templates: list[str], customer: str, industry: str, budget) -> list[dict]:
    """Runs discovery queries, then verifies every candidate URL in code — only verified:true
    entries survive, so the schema's verified flag is a checked fact, never an LLM claim."""
    seen_urls: set[str] = set()
    verified_entries = []
    for template in query_templates:
        if not budget.can_search():
            break
        query = template.format(customer=customer or industry, industry=industry or customer)
        budget.note_search()
        results = await serper_search_structured(query, num_results=4)
        for r in results:
            if r["url"] in seen_urls:
                continue
            seen_urls.add(r["url"])
            is_live = await verify_url(r["url"], budget)
            if is_live:
                verified_entries.append({**r, "verified": True})
    return verified_entries


def _format_verified_list(label: str, entries: list[dict]) -> str:
    if not entries:
        return f"{label}: none found/verified."
    lines = [f"{label} (every URL below was checked by an HTTP request and is live):"]
    lines += [f"  - {e['title']} ({e['url']}): {e['snippet']}" for e in entries]
    return "\n".join(lines)


async def customer_validation_node(state: OrchestratorState) -> dict:
    try:
        db = get_database()
        project = await db.projects.find_one({"_id": ObjectId(state["project_id"])}) or {}
        context = build_research_context(project)
        budget = context["research_budget"]

        customer_pillar = context["pillars"]["customer"]
        industry = state.get("industry") or ""

        communities = await _discover_verified(COMMUNITY_QUERY_TEMPLATES, customer_pillar, industry, budget)
        directories = await _discover_verified(DIRECTORY_QUERY_TEMPLATES, customer_pillar, industry, budget)

        market_summary = json.dumps(state.get("market_research") or {}, indent=2)[:3000]
        competitor_summary = json.dumps(state.get("competitors") or {}, indent=2)[:3000]

        verified_block = "\n\n".join([
            _format_verified_list("Communities", communities),
            _format_verified_list("Directories", directories),
        ])

        async def synthesize(prompt_suffix: str) -> dict:
            user_message = f"""{context_as_prompt_block(context)}

MARKET INTELLIGENCE (for sharpening the ICP):
{market_summary}

COMPETITOR INTELLIGENCE (for sharpening the ICP):
{competitor_summary}

{verified_block}

DISCLAIMER TO ECHO VERBATIM IN YOUR OUTPUT: {RESEARCH_DISCLAIMER}

Generate the customer_discovery.v1 report for this business idea, using ONLY the verified communities/directories above.{prompt_suffix}"""
            response = await groq_chat(
                messages=[
                    {"role": "system", "content": CUSTOMER_DISCOVERY_SYSTEM},
                    {"role": "user", "content": user_message},
                ],
                model="llama-3.3-70b-versatile",
                max_tokens=4096,
                temperature=0.9,
            )
            return json.loads(extract_json(response))

        customer_data, status = await run_with_validation(synthesize, "customer")
        if isinstance(customer_data, dict) and len(communities) < 5:
            gaps = customer_data.setdefault("data_gaps", [])
            gaps.append(f"only {len(communities)} verified communities found during discovery, below the 5 target")

        await db.projects.update_one(
            {"_id": ObjectId(state["project_id"])},
            {"$set": {"customerValidation": customer_data, "updatedAt": datetime.now(timezone.utc)}},
        )

        return {
            "customer_validation": customer_data,
            "current_step": "customer_validation",
            "completed_steps": state.get("completed_steps", []) + ["customer_validation"],
            "error": None if status == "ok" else f"customer_validation persisted as partial (validation blocks: {customer_data.get('flags')})",
        }
    except Exception as e:
        logger.exception("customer_validation_node failed")
        return {
            "customer_validation": None,
            "current_step": "customer_validation",
            "completed_steps": state.get("completed_steps", []) + ["customer_validation"],
            "error": f"Customer validation failed: {str(e)}",
        }
