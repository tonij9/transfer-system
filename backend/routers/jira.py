from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from database import get_db
from models.user import User
from models.jira_ticket import JiraTicket
from models.zendesk_ticket import ZendeskTicket
from schemas.jira_ticket import JiraTicketCreate, JiraTicketUpdate, JiraTicketResponse
from auth import get_current_user

router = APIRouter(prefix="/jira", tags=["JIRA Escalations"])


def generate_ticket_key(db: Session):
    count = db.query(JiraTicket).count()
    return f"XFER-{count + 1001}"


@router.get("/tickets", response_model=List[JiraTicketResponse])
def get_jira_tickets(
    status: str = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(JiraTicket)

    if status:
        query = query.filter(JiraTicket.status == status)

    tickets = query.order_by(JiraTicket.created_at.desc()).offset(skip).limit(limit).all()
    return tickets


@router.get("/tickets/{ticket_id}", response_model=JiraTicketResponse)
def get_jira_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ticket = db.query(JiraTicket).filter(JiraTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="JIRA ticket not found")
    return ticket


@router.post("/tickets", response_model=JiraTicketResponse)
def create_jira_ticket(
    ticket_data: JiraTicketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a JIRA escalation ticket"""
    # Verify zendesk ticket exists
    zendesk = db.query(ZendeskTicket).filter(
        ZendeskTicket.id == ticket_data.zendesk_ticket_id
    ).first()
    if not zendesk:
        raise HTTPException(status_code=404, detail="Zendesk ticket not found")

    ticket = JiraTicket(
        ticket_key=generate_ticket_key(db),
        zendesk_ticket_id=ticket_data.zendesk_ticket_id,
        transfer_id=ticket_data.transfer_id,
        summary=ticket_data.summary,
        description=ticket_data.description,
        priority=ticket_data.priority,
        assignee=ticket_data.assignee,
        created_by_id=current_user.id,
    )

    # Update zendesk ticket status
    zendesk.status = "pending"

    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket


@router.put("/tickets/{ticket_id}", response_model=JiraTicketResponse)
def update_jira_ticket(
    ticket_id: int,
    ticket_data: JiraTicketUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ticket = db.query(JiraTicket).filter(JiraTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="JIRA ticket not found")

    update_data = ticket_data.model_dump(exclude_unset=True)

    # If resolving, set resolved_at
    if update_data.get("status") == "Done" and ticket.status != "Done":
        ticket.resolved_at = datetime.utcnow()

    for field, value in update_data.items():
        setattr(ticket, field, value)

    db.commit()
    db.refresh(ticket)
    return ticket
