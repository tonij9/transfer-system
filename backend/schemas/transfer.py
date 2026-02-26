from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime
from decimal import Decimal


class TransferCreate(BaseModel):
    reference_number: str
    customer_name: str
    customer_email: Optional[str] = None
    from_institution: str
    to_institution: str = "Wealthsimple"
    account_number: str
    account_type: str
    transfer_type: str
    transfer_amount: Decimal
    initiated_date: Optional[datetime] = None
    expected_completion: Optional[datetime] = None
    notes: Optional[str] = None


class TransferUpdate(BaseModel):
    status: Optional[str] = None
    issues: Optional[List[str]] = None
    notes: Optional[str] = None


class TransferResponse(BaseModel):
    id: int
    reference_number: str
    customer_name: str
    customer_email: Optional[str]
    from_institution: str
    to_institution: str
    account_number: str
    account_type: str
    transfer_type: str
    transfer_amount: Decimal
    status: str
    initiated_date: Optional[datetime]
    expected_completion: Optional[datetime]
    issues: Optional[List[Any]]
    notes: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
