from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class JiraTicketCreate(BaseModel):
    zendesk_ticket_id: int
    transfer_id: int
    summary: str
    description: str
    priority: str = "Medium"
    assignee: Optional[str] = None


class JiraTicketUpdate(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    assignee: Optional[str] = None
    resolution: Optional[str] = None


class JiraTicketResponse(BaseModel):
    id: int
    ticket_key: str
    zendesk_ticket_id: int
    transfer_id: int
    summary: str
    description: str
    priority: str
    status: str
    assignee: Optional[str]
    created_by_id: int
    resolution: Optional[str]
    resolved_at: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
