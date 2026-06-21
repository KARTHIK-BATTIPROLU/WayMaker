from datetime import datetime, timezone
from agents.budget import ResearchBudget, build_budget


def _pillars_from_project(project: dict) -> dict:
    """Maps the richer ideation intake into the five-pillar shape the agents expect.
    Falls back to idea/industry/target_audience/location when ideation hasn't run —
    the agents already degrade gracefully on empty pillar fields."""
    extracted = (project.get("ideation") or {}).get("extracted") or {}

    problem = extracted.get("problem") or project.get("idea", "")
    customer = extracted.get("targetCustomer") or project.get("targetAudience", "")
    solution = extracted.get("solutionWedge") or project.get("idea", "")
    market = extracted.get("alternatives") or project.get("industry", "")
    business_model = extracted.get("valueAndWillingness") or ""

    return {
        "problem": problem,
        "customer": customer,
        "solution": solution,
        "market": market,
        "business_model": business_model,
    }


def build_research_context(project: dict) -> dict:
    """Builds the SharedResearchContext injected into every research node's user message."""
    hackathon_mode = bool(project.get("hackathonMode", False))

    return {
        "pillars": _pillars_from_project(project),
        "business_brief": project.get("idea", ""),
        "goal_profile": {
            "industry": project.get("industry") or "[UNKNOWN]",
            "location": project.get("location") or "[UNKNOWN]",
        },
        "geography": "IN",
        "hackathon_mode": hackathon_mode,
        "research_budget": build_budget(hackathon_mode),
        "run_metadata": {
            "project_id": str(project.get("_id") or project.get("id") or ""),
            "generated_at": datetime.now(timezone.utc).isoformat(),
        },
    }


def context_as_prompt_block(context: dict) -> str:
    """Renders the context dict as a text block to inject alongside gathered research."""
    pillars = context["pillars"]
    return f"""SHARED RESEARCH CONTEXT
Geography: {context['geography']} (India-first, INR unless stated otherwise)
Hackathon mode: {context['hackathon_mode']}

Pillars:
- Problem: {pillars['problem'] or '[UNKNOWN]'}
- Customer: {pillars['customer'] or '[UNKNOWN]'}
- Solution: {pillars['solution'] or '[UNKNOWN]'}
- Market: {pillars['market'] or '[UNKNOWN]'}
- Business model: {pillars['business_model'] or '[UNKNOWN]'}

Industry: {context['goal_profile']['industry']}
Location: {context['goal_profile']['location']}"""
