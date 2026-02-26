from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from database import Base


class JiraTicket(Base):
    __tablename__ = "jira_tickets"

    id = Column(Integer, primary_key=True, index=True)
    ticket_key = Column(String, unique=True, index=True)  # e.g., "XFER-1234"

    # Source references
    zendesk_ticket_id = Column(Integer, ForeignKey("zendesk_tickets.id"), index=True)
    transfer_id = Column(Integer, ForeignKey("transfers.id"), index=True)

    # Ticket content
    summary = Column(String)
    description = Column(Text)

    # Status and priority
    priority = Column(String, default="Medium")  # Low, Medium, High, Critical
    status = Column(String, default="To Do")  # To Do, In Progress, Done

    # Assignment
    assignee = Column(String, nullable=True)  # Transfers team member name
    created_by_id = Column(Integer, ForeignKey("users.id"))  # CS agent who escalated

    # Resolution
    resolution = Column(Text, nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
