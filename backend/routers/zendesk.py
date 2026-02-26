from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import random
import string

from database import get_db
from models.user import User
from models.zendesk_ticket import ZendeskTicket
from models.transfer import Transfer
from schemas.zendesk_ticket import ZendeskTicketCreate, ZendeskTicketUpdate, ZendeskTicketResponse
from auth import get_current_user

router = APIRouter(prefix="/zendesk", tags=["Zendesk Tickets"])


def generate_ticket_number():
    return f"ZEN-{''.join(random.choices(string.digits, k=6))}"


@router.get("/tickets", response_model=List[ZendeskTicketResponse])
def get_tickets(
    status: str = None,
    priority: str = None,
    assigned_to_me: bool = False,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(ZendeskTicket)

    if status:
        query = query.filter(ZendeskTicket.status == status)
    if priority:
        query = query.filter(ZendeskTicket.priority == priority)
    if assigned_to_me:
        query = query.filter(ZendeskTicket.assigned_agent_id == current_user.id)

    tickets = query.order_by(ZendeskTicket.created_at.desc()).offset(skip).limit(limit).all()
    return tickets


@router.get("/tickets/{ticket_id}", response_model=ZendeskTicketResponse)
def get_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ticket = db.query(ZendeskTicket).filter(ZendeskTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket


@router.post("/tickets", response_model=ZendeskTicketResponse)
def create_ticket(
    ticket_data: ZendeskTicketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ticket = ZendeskTicket(
        ticket_number=generate_ticket_number(),
        customer_name=ticket_data.customer_name,
        customer_email=ticket_data.customer_email,
        subject=ticket_data.subject,
        description=ticket_data.description,
        priority=ticket_data.priority,
        transfer_reference=ticket_data.transfer_reference,
    )

    # Auto-link to transfer if reference provided
    if ticket_data.transfer_reference:
        transfer = db.query(Transfer).filter(
            Transfer.reference_number == ticket_data.transfer_reference
        ).first()
        if transfer:
            ticket.transfer_id = transfer.id

    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket


@router.put("/tickets/{ticket_id}", response_model=ZendeskTicketResponse)
def update_ticket(
    ticket_id: int,
    ticket_data: ZendeskTicketUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ticket = db.query(ZendeskTicket).filter(ZendeskTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    update_data = ticket_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(ticket, field, value)

    db.commit()
    db.refresh(ticket)
    return ticket


@router.post("/tickets/{ticket_id}/assign", response_model=ZendeskTicketResponse)
def assign_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Assign ticket to current user"""
    ticket = db.query(ZendeskTicket).filter(ZendeskTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    ticket.assigned_agent_id = current_user.id
    ticket.status = "in_progress"
    db.commit()
    db.refresh(ticket)
    return ticket
