from datetime import datetime
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, ConfigDict, Field


class CitationSourceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    audit_run_id: str
    engine_name: str
    prompt_text: str
    brand_mentioned: bool
    brand_rank: Optional[int] = None
    competitor_mentioned: bool
    sentiment: Optional[str] = None
    cited_urls_json: Optional[List[Union[str, Dict[str, Any]]]] = None
    raw_response: Optional[str] = None
    created_at: datetime


class AuditRunCreate(BaseModel):
    competitor_domain: str = Field(..., min_length=3, max_length=512)
    prompt_ids: Optional[List[str]] = Field(default=None, description="Optional list of prompt IDs to run; if empty, all active prompts are used")


class AuditRunResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    workspace_id: str
    competitor_domain: str
    status: str
    overall_visibility_score: Optional[float] = None
    competitor_score: Optional[float] = None
    raw_results_json: Optional[Dict[str, Any]] = None
    created_at: datetime
    citations: List[CitationSourceResponse] = []


class AuditRunListResponse(BaseModel):
    audit_runs: List[AuditRunResponse]
    total: int
