import json
import logging
from urllib.parse import urlparse
from agents.state import OrchestratorState
from agents.prompts import COMPETITIVE_INTELLIGENCE_SYSTEM, RESEARCH_DISCLAIMER
from agents.context import build_research_context, context_as_prompt_block
from agents.validators import run_with_validation
from services.groq_service import groq_chat, extract_json
from services.search_service import serper_search_structured, enrich_competitor, verify_url
from db.database import get_database
from bson import ObjectId
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

DISCOVERY_QUERY_TEMPLATES = [
    "{idea} competitors",
    "{idea} alternatives",
    "best {industry} tools 2025 India",
    "{industry} startups India",
    "top {industry} companies",
    "{idea} vs",
]

MAX_CANDIDATES = 8

CANDIDATE_EXTRACTION_SYSTEM = """You extract real company/product names from search result snippets.
You will be given a list of search results (title, url, snippet). Return ONLY a valid JSON array
of up to 8 distinct company/product names that ACTUALLY APPEAR in the titles or snippets below —
never invent a name that isn't textually present. No markdown, no explanation.
["Company A", "Company B"]"""


def _domain(url: str) -> str:
    try:
        return urlparse(url).netloc.replace("www.", "")
    except Exception:
        return url


async def _discover_candidates(state: OrchestratorState, context: dict) -> list[dict]:
    """Runs the discovery query sweep via Serper, dedupes results by domain, and asks Groq
    to extract candidate company names strictly from the real snippets gathered (not from
    training knowledge) — closing the original no-grounding gap."""
    budget = context["research_budget"]
    idea = state["idea"]
    industry = state.get("industry") or "startup"

    seen_domains: set[str] = set()
    pool: list[dict] = []
    for template in DISCOVERY_QUERY_TEMPLATES:
        if not budget.can_search():
            break
        query = template.format(idea=idea, industry=industry)
        budget.note_search()
        results = await serper_search_structured(query, num_results=5)
        for r in results:
            domain = _domain(r["url"])
            if domain in seen_domains:
                continue
            seen_domains.add(domain)
            pool.append(r)

    if not pool:
        return []

    listing = "\n".join(f"- {r['title']} | {r['url']} | {r['snippet']}" for r in pool)
    response = await groq_chat(
        messages=[
            {"role": "system", "content": CANDIDATE_EXTRACTION_SYSTEM},
            {"role": "user", "content": listing},
        ],
        max_tokens=512,
        temperature=0.3,
    )
    try:
        names = json.loads(extract_json(response))
    except json.JSONDecodeError:
        names = []
    if not isinstance(names, list):
        names = []
    return [{"name": n} for n in names[:MAX_CANDIDATES] if isinstance(n, str) and n.strip()]


async def _build_dossier(candidates: list[dict], budget) -> list[dict]:
    """Enriches each candidate (homepage/pricing/funding/app-store) and verifies its
    homepage URL in code, so every dossier entry carries a real, checked source."""
    dossier = []
    for candidate in candidates:
        name = candidate["name"]
        enrichment = await enrich_competitor(name, budget)
        sources = []
        for bucket_name in ("homepage", "pricing", "funding", "app_store"):
            for r in enrichment.get(bucket_name, [])[:1]:
                verified = await verify_url(r["url"], budget)
                sources.append({"name": f"{name} – {bucket_name}", "url": r["url"], "verified": verified})
        verified_sources = [s for s in sources if s["verified"]]
        if not verified_sources:
            continue  # drop candidates with zero verifiable sources — no ungrounded entries
        dossier.append({"name": name, "enrichment": enrichment, "sources": verified_sources})
    return dossier


def _format_dossier(dossier: list[dict]) -> str:
    lines = ["--- GROUNDED COMPETITOR DOSSIER (every URL below was checked by an HTTP request) ---"]
    for entry in dossier:
        lines.append(f"\n## {entry['name']}")
        for s in entry["sources"]:
            lines.append(f"  VERIFIED SOURCE: {s['url']}")
        for bucket_name, label in (("homepage", "Homepage search"), ("pricing", "Pricing search"),
                                    ("funding", "Funding search"), ("app_store", "App store / reviews search")):
            results = entry["enrichment"].get(bucket_name, [])
            if results:
                lines.append(f"  {label}:")
                lines += [f"    - {r['title']} ({r['url']}): {r['snippet']}" for r in results]
    lines.append("--- END DOSSIER ---")
    return "\n".join(lines)


async def competitors_node(state: OrchestratorState) -> dict:
    try:
        db = get_database()
        project = await db.projects.find_one({"_id": ObjectId(state["project_id"])}) or {}
        context = build_research_context(project)
        budget = context["research_budget"]

        candidates = await _discover_candidates(state, context)
        dossier = await _build_dossier(candidates, budget)

        if not dossier:
            raise ValueError("no verifiable competitors found in discovery sweep")

        dossier_text = _format_dossier(dossier)

        async def synthesize(prompt_suffix: str) -> dict:
            user_message = f"""{context_as_prompt_block(context)}

{dossier_text}

DISCLAIMER TO ECHO VERBATIM IN YOUR OUTPUT: {RESEARCH_DISCLAIMER}

Generate the competitor_intelligence.v1 report for this business idea, using ONLY the dossier above.{prompt_suffix}"""
            response = await groq_chat(
                messages=[
                    {"role": "system", "content": COMPETITIVE_INTELLIGENCE_SYSTEM},
                    {"role": "user", "content": user_message},
                ],
                model="llama-3.3-70b-versatile",
                max_tokens=4096,
                temperature=0.9,
            )
            return json.loads(extract_json(response))

        competitor_data, status = await run_with_validation(synthesize, "competitor")

        await db.projects.update_one(
            {"_id": ObjectId(state["project_id"])},
            {"$set": {"competitors": competitor_data, "updatedAt": datetime.now(timezone.utc)}},
        )

        return {
            "competitors": competitor_data,
            "current_step": "competitors",
            "completed_steps": state.get("completed_steps", []) + ["competitors"],
            "error": None if status == "ok" else f"competitors persisted as partial (validation blocks: {competitor_data.get('flags')})",
        }
    except Exception as e:
        logger.exception("competitors_node failed")
        return {
            "competitors": None,
            "current_step": "competitors",
            "completed_steps": state.get("completed_steps", []) + ["competitors"],
            "error": f"Competitors failed: {str(e)}",
        }
