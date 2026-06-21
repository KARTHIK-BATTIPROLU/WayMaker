import asyncio
import logging
import feedparser
from typing import List
from services.search_service import serper_search_structured

logger = logging.getLogger(__name__)

CAP_PER_SOURCE = 8


async def fetch_rss(sources: List[dict]) -> List[dict]:
    """Pulls recent entries from active RSS sources. Cheap, exact provenance."""
    items: List[dict] = []
    rss_sources = [s for s in sources if s.get("type") == "rss" and s.get("active", True)]

    def parse_one(source: dict) -> List[dict]:
        try:
            feed = feedparser.parse(source["url"])
        except Exception as e:
            logger.warning(f"RSS parse failed for {source.get('url')}: {e}")
            return []
        out = []
        for entry in feed.entries[:CAP_PER_SOURCE]:
            link = entry.get("link")
            if not link:
                continue
            out.append({
                "title": entry.get("title", ""),
                "url": link,
                "snippet": entry.get("summary", "")[:300],
                "source_name": source["name"],
            })
        return out

    results = await asyncio.gather(*[asyncio.to_thread(parse_one, s) for s in rss_sources])
    for r in results:
        items.extend(r)
    return items


async def search(query: str, source_name: str = "Web Search") -> List[dict]:
    """Wraps the structured Serper search, tagging results with a source name for provenance."""
    results = await serper_search_structured(query, num_results=CAP_PER_SOURCE)
    return [{**r, "source_name": source_name} for r in results]


async def gather_candidates(config: dict, sources: List[dict]) -> dict:
    """Returns {"now": [...], "upcoming": [...]} candidate pools, each item tagged with its source."""
    domain = config.get("domain", "")
    keywords = " ".join(config.get("keywords", []))
    horizon_months = config.get("forward_horizon_months", 12)

    rss_items, now_search, upcoming_search = await asyncio.gather(
        fetch_rss(sources),
        search(f"{domain} {keywords} latest news today".strip(), source_name="Web Search (current)"),
        search(
            f"{domain} {keywords} trends upcoming releases next {horizon_months} months".strip(),
            source_name="Web Search (forward-looking)",
        ),
    )

    seen_urls = set()

    def dedupe(items: List[dict]) -> List[dict]:
        out = []
        for item in items:
            url = item.get("url")
            if not url or url in seen_urls:
                continue
            seen_urls.add(url)
            out.append(item)
        return out

    return {
        "now": dedupe(rss_items + now_search),
        "upcoming": dedupe(upcoming_search),
    }
