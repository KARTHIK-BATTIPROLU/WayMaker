from pydantic import BaseModel, Field
from typing import Optional, List, Any, Literal
from datetime import datetime


# ── Ideation sub-models ──────────────────────────────────────────────────────

class IdeationMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str
    timestamp: datetime


class ExtractedIdea(BaseModel):
    problem: str = ""
    targetCustomer: str = ""
    solutionWedge: str = ""
    alternatives: str = ""
    valueAndWillingness: str = ""
    industry: str = ""
    location: str = ""


class DimensionScores(BaseModel):
    problem: int = 0
    targetCustomer: int = 0
    solutionWedge: int = 0
    alternatives: int = 0
    valueAndWillingness: int = 0


class IdeationData(BaseModel):
    messages: List[IdeationMessage] = []
    extracted: ExtractedIdea = Field(default_factory=ExtractedIdea)
    dimensionScores: DimensionScores = Field(default_factory=DimensionScores)
    confidence: int = 0
    ready: bool = False
    status: Literal["ideating", "ready", "analyzed"] = "ideating"

class FundingOpportunityModel(BaseModel):
    type: str
    name: str
    amount: str
    description: str
    matchReason: str
    link: Optional[str] = None

class ProjectCreate(BaseModel):
    idea: str = Field(min_length=1, max_length=2000)
    industry: Optional[str] = Field(None, max_length=200)
    targetAudience: Optional[str] = Field(None, max_length=200)
    location: Optional[str] = Field(None, max_length=200)
    hackathonMode: Optional[bool] = False

class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=200)
    industry: Optional[str] = None
    targetAudience: Optional[str] = None
    location: Optional[str] = None
    hackathonMode: Optional[bool] = None
    marketResearch: Optional[dict] = None
    # competitor_intelligence.v1 object (not the old List[CompetitorModel] shape — see is_legacy_competitors_shape)
    competitors: Optional[dict] = None
    customerValidation: Optional[dict] = None
    websiteCode: Optional[str] = None
    fundingOpportunities: Optional[List[FundingOpportunityModel]] = None
    competitorAnalytics: Optional[List[Any]] = None
    webhookUrl: Optional[str] = None
    zapierWebhookUrl: Optional[str] = None

class ProjectOut(BaseModel):
    id: str
    userId: str
    name: str
    idea: str
    industry: Optional[str] = None
    targetAudience: Optional[str] = None
    location: Optional[str] = None
    hackathonMode: bool = False
    marketResearch: Optional[dict] = None
    # competitor_intelligence.v1 object once regenerated; may still be the legacy List[dict]
    # shape for projects that haven't been re-run since the v2 research pipeline shipped.
    competitors: Optional[Any] = None
    customerValidation: Optional[dict] = None
    websiteCode: Optional[str] = None
    fundingOpportunities: List[FundingOpportunityModel] = []
    competitorAnalytics: List[Any] = []
    webhookUrl: Optional[str] = None
    zapierWebhookUrl: Optional[str] = None
    marketingKitGenerated: bool = False
    ideation: Optional[IdeationData] = None
    createdAt: datetime
    updatedAt: datetime


def is_legacy_competitors_shape(competitors: Any) -> bool:
    """True for pre-v2 docs where `competitors` is still the flat List[{name,strengths,weaknesses,gap}]
    instead of the new competitor_intelligence.v1 object. The frontend uses this to show a
    're-run pipeline to upgrade' notice instead of crashing on the old shape."""
    return isinstance(competitors, list)

