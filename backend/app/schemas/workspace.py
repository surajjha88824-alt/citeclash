from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, HttpUrl


class WorkspaceBase(BaseModel):
    brand_name: str = Field(..., min_length=2, max_length=255, description="Name of the brand or company")
    domain_url: str = Field(..., min_length=3, max_length=512, description="Website or domain (e.g. acme.com)")
    industry: Optional[str] = Field(None, max_length=128)
    logo_url: Optional[str] = Field(None, max_length=1024)


class WorkspaceCreate(WorkspaceBase):
    pass


class WorkspaceUpdate(BaseModel):
    brand_name: Optional[str] = Field(None, min_length=2, max_length=255)
    domain_url: Optional[str] = Field(None, min_length=3, max_length=512)
    industry: Optional[str] = Field(None, max_length=128)
    logo_url: Optional[str] = Field(None, max_length=1024)
    plan_tier: Optional[str] = Field(None, pattern="^(free|starter|growth|agency)$")
    subscription_status: Optional[str] = None


class WorkspaceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    owner_id: str
    brand_name: str
    domain_url: str
    industry: Optional[str] = None
    logo_url: Optional[str] = None
    plan_tier: str
    subscription_status: str
    monthly_prompt_limit: int
    prompts_used_this_month: int
    created_at: datetime
    updated_at: Optional[datetime] = None


class WorkspaceListResponse(BaseModel):
    workspaces: List[WorkspaceResponse]
    total: int
