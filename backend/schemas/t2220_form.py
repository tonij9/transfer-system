from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from decimal import Decimal


class T2220FormCreate(BaseModel):
    form_number: str
    transfer_id: int
    account_holder_name: str
    account_number_on_form: str
    account_type_on_form: str
    transfer_amount_on_form: Decimal
    transfer_type_on_form: str
    signature_date: Optional[datetime] = None
    form_pdf_url: Optional[str] = None


class T2220FormVerify(BaseModel):
    verified: bool
    verification_notes: Optional[str] = None


class T2220FormResponse(BaseModel):
    id: int
    form_number: str
    transfer_id: int
    account_holder_name: str
    account_number_on_form: str
    account_type_on_form: str
    transfer_amount_on_form: Decimal
    transfer_type_on_form: str
    signature_date: Optional[datetime]
    form_pdf_url: Optional[str]
    verified: bool
    verification_notes: Optional[str]
    verified_by_id: Optional[int]
    verified_at: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
