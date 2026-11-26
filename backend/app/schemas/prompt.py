from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class PromptCreate(BaseModel):
    prompt_text: str = Field(..., min_length=3, description="Search prompt or query to track across AI engines")
    is_active: bool = True


class PromptUpdate(BaseModel):
    prompt_text: Optional[str] = Field(None, min_length=3)
    is_active: Optional[bool] = None


class PromptResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    workspace_id: str
    prompt_text: str
    is_active: bool
    created_at: datetime


class PromptListResponse(BaseModel):
    prompts: List[PromptResponse]
    total: int
