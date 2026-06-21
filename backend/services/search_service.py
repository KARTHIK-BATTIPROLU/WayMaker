import asyncio
import httpx
from typing import Optional, TYPE_CHECKING
from core.config import settings

if TYPE_CHECKING:
    from agents.budget import ResearchBudget

async def serper_search_structured(query: str, num_results: int = 8) -> list[dict]:
    """Search Google via Serper API, returning structured results with source URLs."""
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                "https://google.serper.dev/search",
                headers={
                    "X-API-KEY": settings.serper_api_key,
                    "Content-Type": "application/json"
                },
                json={"q": query, "num": num_results}
            )
            if response.status_code != 200:
                return []
            data = response.json()
            results = data.get("organic", [])[:num_results]
            return [
                {"title": r.get("title", ""), "url": r.get("link", ""), "snippet": r.get("snippet", "")}
                for r in results if r.get("link")
            ]
    except Exception:
        return []

async def serper_search(query: str, num_results: int = 8) -> str:
    """Search Google via Serper API and return formatted results"""
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                "https://google.serper.dev/search",
                headers={
                    "X-API-KEY": settings.serper_api_key,
                    "Content-Type": "application/json"
                },
                json={"q": query, "num": num_results}
            )
            if response.status_code != 200:
                return ""
            data = response.json()
            results = data.get("organic", [])[:num_results]
            if not results:
                return ""
            formatted_lines = []
            for r in results:
                title = r.get("title", "")
                link = r.get("link", "")
                snippet = r.get("snippet", "")
                formatted_lines.append(f"- **{title}** ({link}): {snippet}")
            formatted = "\n".join(formatted_lines)
            return (
                f"--- REAL-WORLD MARKET DATA (from Google Search) ---\n"
                f"{formatted}\n"
                f"--- END OF REAL-WORLD DATA ---"
            )
    except Exception:
        return ""

async def fetch_real_world_context(idea: str, industry: Optional[str] = None) -> str:
    """Build market research query and fetch search results"""
    query = f"{idea} {industry or ''} market size trends competitors 2024 2025".strip()
    return await serper_search(query)


async def _budgeted_search(query: str, budget: Optional["ResearchBudget"], num_results: int = 5) -> list[dict]:
    """serper_search_structured gated by the research budget. Returns [] once the cap is hit."""
    if budget is not None and not budget.can_search():
        return []
    if budget is not None:
        budget.note_search()
    return await serper_search_structured(query, num_results=num_results)


async def enrich_competitor(name: str, budget: Optional["ResearchBudget"] = None) -> dict:
    """Gathers a homepage / pricing / funding-database / app-store bundle for one company,
    used to ground competitor cards in real source URLs instead of LLM training knowledge."""
    homepage, pricing, funding, app_store = await asyncio.gather(
        _budgeted_search(f"{name} official website", budget, num_results=3),
        _budgeted_search(f"{name} pricing plans", budget, num_results=3),
        _budgeted_search(f"{name} Tracxn funding valuation", budget, num_results=3),
        _budgeted_search(f"{name} Play Store OR App Store reviews", budget, num_results=3),
    )
    return {
        "name": name,
        "homepage": homepage,
        "pricing": pricing,
        "funding": funding,
        "app_store": app_store,
    }


async def verify_url(url: str, budget: Optional["ResearchBudget"] = None) -> bool:
    """Confirms a candidate URL (community, directory, competitor source) actually resolves,
    so `verified:true` in node output is checked in code, not claimed by the LLM."""
    if budget is not None and not budget.can_fetch():
        return False
    if budget is not None:
        budget.note_fetch()
    try:
        async with httpx.AsyncClient(timeout=6.0, follow_redirects=True) as client:
            response = await client.head(url)
            if response.status_code >= 400:
                response = await client.get(url)
            return response.status_code < 400
    except Exception:
        return False


async def trends_signal(term: str, budget: Optional["ResearchBudget"] = None) -> dict:
    """Demand-signal proxy derived from Serper search/news volume (no real Google Trends API
    behind Serper). Swappable later for a pytrends/SerpApi adapter behind this same signature."""
    results = await _budgeted_search(f"{term} 2025 growth trend India", budget, num_results=8)
    return {
        "term": term,
        "source": "serper_proxy",
        "result_count": len(results),
        "snippets": [r["snippet"] for r in results if r.get("snippet")][:5],
    }
