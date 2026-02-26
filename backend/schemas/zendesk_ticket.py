from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ZendeskTicketCreate(BaseModel):
    customer_name: str
    customer_email: str
    subject: str
    description: str
    priority: str = "normal"
    transfer_reference: Optional[str] = None


class ZendeskTicketUpdate(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    assigned_agent_id: Optional[int] = None
    resolution_notes: Optional[str] = None
    transfer_id: Optional[int] = None


class ZendeskTicketResponse(BaseModel):
    id: int
    ticket_number: str
    customer_name: str
    customer_email: str
    subject: str
    description: str
    status: str
    priority: str
    transfer_reference: Optional[str]
    transfer_id: Optional[int]
    assigned_agent_id: Optional[int]
    resolution_notes: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
