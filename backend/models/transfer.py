from sqlalchemy import Column, Integer, String, Numeric, DateTime, Text, JSON
from sqlalchemy.sql import func
from database import Base


class Transfer(Base):
    __tablename__ = "transfers"

    id = Column(Integer, primary_key=True, index=True)
    reference_number = Column(String, unique=True, index=True)  # e.g., "TRF-2024-001234"
    customer_name = Column(String, index=True)
    customer_email = Column(String)

    # Transfer details
    from_institution = Column(String)  # e.g., "TD Bank"
    to_institution = Column(String, default="Wealthsimple")
    account_number = Column(String)
    account_type = Column(String)  # RRSP, TFSA, Non-Registered, RESP
    transfer_type = Column(String)  # full, partial
    transfer_amount = Column(Numeric(12, 2))

    # Status tracking
    status = Column(String, default="pending")  # pending, processing, completed, failed, rejected
    initiated_date = Column(DateTime(timezone=True))
    expected_completion = Column(DateTime(timezone=True))

    # Issues and notes
    issues = Column(JSON, default=list)  # List of detected issues
    notes = Column(Text)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
