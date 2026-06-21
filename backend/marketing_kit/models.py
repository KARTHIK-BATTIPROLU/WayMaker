from pydantic import BaseModel, Field
from typing import Optional, List, Literal


# ── Generation pipeline ──────────────────────────────────────────────────────

class RunRequest(BaseModel):
    user_input: str = Field(min_length=1, max_length=2000)
    origin: Literal["own_idea", "calendar"] = "own_idea"
    topic_id: Optional[str] = None
    brand_asset_url: Optional[str] = None
    project_id: Optional[str] = None


class PlatformRunRequest(BaseModel):
    user_input: str = Field(min_length=1, max_length=2000)
    target_platforms: List[str] = Field(min_length=1)
    origin: Literal["own_idea", "calendar"] = "own_idea"
    topic_id: Optional[str] = None
    brand_asset_url: Optional[str] = None
    project_id: Optional[str] = None


class AssetUploadRequest(BaseModel):
    image_base64: str = Field(min_length=1)


class ActionRequest(BaseModel):
    action: Literal["approve", "regenerate_post", "regenerate_images"]


class EditRequest(BaseModel):
    post_text: str = Field(min_length=1)


class PreferencesUpdate(BaseModel):
    content: str


class DeployRequest(BaseModel):
    platform: str


# ── Content Calendar ──────────────────────────────────────────────────────

class SourceCreate(BaseModel):
    name: str
    type: Literal["rss", "website", "twitter", "youtube", "blog"]
    url: str


class PermanentAddRequest(BaseModel):
    topic_id: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    horizon: Optional[Literal["now", "upcoming"]] = None
    category: Optional[str] = None
    sources: Optional[List[dict]] = None


class ConfigUpdate(BaseModel):
    domain: Optional[str] = None
    keywords: Optional[List[str]] = None
    timezone: Optional[str] = None
    daily_topic_count: Optional[int] = None
    forward_horizon_months: Optional[int] = None
    active: Optional[bool] = None


class GenerateFromTopicRequest(BaseModel):
    topic_id: str
    mode: Literal["linkedin", "platform"] = "linkedin"
    target_platforms: Optional[List[str]] = None
