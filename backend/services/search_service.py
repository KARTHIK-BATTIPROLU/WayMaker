import httpx
from typing import Optional
from core.config import settings

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
