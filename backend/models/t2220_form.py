from sqlalchemy import Column, Integer, String, Numeric, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class T2220Form(Base):
    __tablename__ = "t2220_forms"

    id = Column(Integer, primary_key=True, index=True)
    form_number = Column(String, unique=True, index=True)  # e.g., "T2220-2024-001234"
    transfer_id = Column(Integer, ForeignKey("transfers.id"), index=True)

    # Form data (what's on the actual T2220 form)
    account_holder_name = Column(String)
    account_number_on_form = Column(String)
    account_type_on_form = Column(String)  # RRSP, TFSA, Non-Registered, RESP
    transfer_amount_on_form = Column(Numeric(12, 2))
    transfer_type_on_form = Column(String)  # full, partial

    # Document info
    signature_date = Column(DateTime(timezone=True))
    form_pdf_url = Column(String)  # Link to PDF view

    # Verification status
    verified = Column(Boolean, default=False)
    verification_notes = Column(Text)
    verified_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    verified_at = Column(DateTime(timezone=True), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
