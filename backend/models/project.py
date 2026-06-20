from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime

class CompetitorModel(BaseModel):
    name: str
    strengths: List[str]
    weaknesses: List[str]
    gap: str

class MarketingPostModel(BaseModel):
    platform: str
    content: str
    hashtags: List[str]
    imagePrompt: str

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

class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=200)
    industry: Optional[str] = None
    targetAudience: Optional[str] = None
    location: Optional[str] = None
    marketResearch: Optional[dict] = None
    competitors: Optional[List[CompetitorModel]] = None
    websiteCode: Optional[str] = None
    marketingKit: Optional[List[MarketingPostModel]] = None
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
    marketResearch: Optional[dict] = None
    competitors: List[CompetitorModel] = []
    websiteCode: Optional[str] = None
    marketingKit: List[MarketingPostModel] = []
    fundingOpportunities: List[FundingOpportunityModel] = []
    competitorAnalytics: List[Any] = []
    webhookUrl: Optional[str] = None
    zapierWebhookUrl: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime
