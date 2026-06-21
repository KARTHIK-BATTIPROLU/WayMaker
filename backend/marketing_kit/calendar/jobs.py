import json
import logging
from services.groq_service import groq_chat, extract_json
from marketing_kit import store
from marketing_kit.calendar.research import gather_candidates

logger = logging.getLogger(__name__)

SYNTHESIS_SYSTEM = """You are a content strategist building a daily topic calendar for a startup's social media.
You are given two pools of candidate items (each with a title, url, and snippet) gathered by web search/RSS:
- "now": current/recent updates in the domain
- "upcoming": forward-looking trends, releases, and events over the next several months

Synthesize exactly {count} distinct social-media-ready topics from these candidates. Mix "now" and "upcoming" horizons.

CRITICAL RULE: every topic's "sources" must cite ONLY urls that appear in the candidate pools below.
Never invent a source, title, or url that is not in the provided lists. If you cannot find {count} good
topics from the candidates, return fewer rather than inventing sources.

Return ONLY a valid JSON array, no markdown, no explanation:
[
  {{
    "title": "concise topic title",
    "description": "1-2 sentence angle for a social post on this topic",
    "horizon": "now" or "upcoming",
    "category": "short tag",
    "sources": [{{"name": "source display name", "url": "https://..."}}]
  }}
]"""


def _format_pool(label: str, items: list[dict]) -> str:
    lines = [f"-- {label} candidates --"]
    for item in items:
        lines.append(f"* {item.get('title')} | {item.get('url')} | {item.get('source_name', '')}")
    return "\n".join(lines)


async def synthesize_topics(candidates: dict, config: dict) -> list[dict]:
    count = config.get("daily_topic_count", 30)
    now_items = candidates.get("now", [])
    upcoming_items = candidates.get("upcoming", [])
    if not now_items and not upcoming_items:
        return []

    valid_urls = {item["url"] for item in now_items + upcoming_items}
    url_to_name = {item["url"]: item.get("source_name", item.get("title", "")) for item in now_items + upcoming_items}

    user_message = "\n\n".join([
        _format_pool("now", now_items),
        _format_pool("upcoming", upcoming_items),
    ])

    response = await groq_chat(
        messages=[
            {"role": "system", "content": SYNTHESIS_SYSTEM.format(count=count)},
            {"role": "user", "content": user_message},
        ],
        model="llama-3.3-70b-versatile",
        max_tokens=4096,
        temperature=0.7,
    )

    try:
        topics = json.loads(extract_json(response), strict=False)
    except json.JSONDecodeError:
        logger.error("synthesize_topics: failed to parse Groq response as JSON")
        return []
    if not isinstance(topics, list):
        return []

    validated = []
    for topic in topics[:count]:
        sources = [
            {"name": url_to_name.get(s.get("url"), s.get("name", "")), "url": s["url"]}
            for s in topic.get("sources", [])
            if s.get("url") in valid_urls
        ]
        if not sources:
            continue  # provenance is mandatory -- drop topics with no verifiable source
        validated.append({
            "title": topic.get("title", ""),
            "description": topic.get("description", ""),
            "horizon": topic.get("horizon") if topic.get("horizon") in ("now", "upcoming") else "now",
            "category": topic.get("category"),
            "sources": sources,
        })
    return validated


async def run_daily_refresh() -> dict:
    config = await store.get_config()
    sources = await store.list_sources(active_only=True)
    date_str = store.ist_today_str()

    if not config.get("active", True):
        return {"status": "skipped", "reason": "calendar inactive", "date": date_str, "count": 0}

    candidates = await gather_candidates(config, sources)
    topics = await synthesize_topics(candidates, config)

    if not topics:
        logger.warning("run_daily_refresh: synthesis produced no topics, keeping prior day's set")
        return {"status": "no_topics", "date": date_str, "count": 0}

    await store.replace_daily_topics(topics, date_str)
    await store.set_config_last_run(date_str)
    return {"status": "ok", "date": date_str, "count": len(topics)}
