from typing import TypedDict, Optional, List, Any, Annotated
import operator

def replace(current, new):
    return new

def reduce_errors(current, new):
    if not current and not new:
        return None
    if current and not new:
        return current
    if not current and new:
        return new
    return f"{current} | {new}"

class OrchestratorState(TypedDict):
    # Input
    project_id: str
    user_id: str
    idea: str
    industry: Optional[str]
    target_audience: Optional[str]
    location: Optional[str]
    # Generated data (populated by nodes)
    web_search_context: Optional[str]
    market_research: Optional[dict]
    competitors: Optional[dict]
    customer_validation: Optional[dict]
    website_code: Optional[str]
    funding: Optional[List[dict]]
    # Pipeline tracking
    current_step: Annotated[str, replace]
    completed_steps: Annotated[List[str], operator.add]
    error: Annotated[Optional[str], reduce_errors]
