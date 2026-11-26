from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class TicketMessageCreate(BaseModel):
    message: str = Field(..., min_length=1, description="Content of the message")


class TicketMessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    ticket_id: str
    sender_id: str
    message: str
    is_admin_reply: bool
    created_at: datetime


class TicketCreate(BaseModel):
    workspace_id: Optional[str] = None
    subject: str = Field(..., min_length=3, max_length=255)
    category: str = Field(..., pattern="^(billing|technical|feature_request|other)$")
    priority: str = Field(default="medium", pattern="^(low|medium|high|urgent)$")
    message: str = Field(..., min_length=1)
    attachment_url: Optional[str] = None


class TicketUpdate(BaseModel):
    status: Optional[str] = Field(None, pattern="^(open|in_progress|resolved)$")
    priority: Optional[str] = Field(None, pattern="^(low|medium|high|urgent)$")


class TicketResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    workspace_id: Optional[str] = None
    subject: str
    category: str
    priority: str
    status: str
    attachment_url: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    messages: List[TicketMessageResponse] = []


class TicketListResponse(BaseModel):
    tickets: List[TicketResponse]
    total: int
