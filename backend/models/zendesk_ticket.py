from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from database import Base


class ZendeskTicket(Base):
    __tablename__ = "zendesk_tickets"

    id = Column(Integer, primary_key=True, index=True)
    ticket_number = Column(String, unique=True, index=True)  # e.g., "ZEN-123456"

    # Customer info
    customer_name = Column(String, index=True)
    customer_email = Column(String)

    # Ticket content
    subject = Column(String)
    description = Column(Text)

    # Status and priority
    status = Column(String, default="open")  # open, in_progress, pending, resolved, closed
    priority = Column(String, default="normal")  # low, normal, high, urgent

    # Linking to transfer
    transfer_reference = Column(String, index=True)  # Links to Atlas transfer by reference_number
    transfer_id = Column(Integer, ForeignKey("transfers.id"), nullable=True)

    # Assignment
    assigned_agent_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Resolution
    resolution_notes = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
