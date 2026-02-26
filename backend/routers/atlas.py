from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models.user import User
from models.transfer import Transfer
from models.t2220_form import T2220Form
from schemas.transfer import TransferCreate, TransferUpdate, TransferResponse
from auth import get_current_user

router = APIRouter(prefix="/atlas", tags=["Atlas Transfers"])


@router.get("/transfers", response_model=List[TransferResponse])
def get_transfers(
    status: str = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Transfer)

    if status:
        query = query.filter(Transfer.status == status)

    transfers = query.order_by(Transfer.created_at.desc()).offset(skip).limit(limit).all()
    return transfers


@router.get("/transfers/{transfer_id}", response_model=TransferResponse)
def get_transfer(
    transfer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    transfer = db.query(Transfer).filter(Transfer.id == transfer_id).first()
    if not transfer:
        raise HTTPException(status_code=404, detail="Transfer not found")
    return transfer


@router.get("/transfers/reference/{reference_number}", response_model=TransferResponse)
def get_transfer_by_reference(
    reference_number: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    transfer = db.query(Transfer).filter(Transfer.reference_number == reference_number).first()
    if not transfer:
        raise HTTPException(status_code=404, detail="Transfer not found")
    return transfer


@router.put("/transfers/{transfer_id}", response_model=TransferResponse)
def update_transfer(
    transfer_id: int,
    transfer_data: TransferUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    transfer = db.query(Transfer).filter(Transfer.id == transfer_id).first()
    if not transfer:
        raise HTTPException(status_code=404, detail="Transfer not found")

    update_data = transfer_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(transfer, field, value)

    db.commit()
    db.refresh(transfer)
    return transfer


@router.get("/transfers/{transfer_id}/comparison")
def get_transfer_comparison(
    transfer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get transfer data alongside T2220 form data for comparison"""
    transfer = db.query(Transfer).filter(Transfer.id == transfer_id).first()
    if not transfer:
        raise HTTPException(status_code=404, detail="Transfer not found")

    t2220 = db.query(T2220Form).filter(T2220Form.transfer_id == transfer_id).first()

    # Build comparison data
    comparison = {
        "transfer": {
            "id": transfer.id,
            "reference_number": transfer.reference_number,
            "customer_name": transfer.customer_name,
            "account_number": transfer.account_number,
            "account_type": transfer.account_type,
            "transfer_amount": float(transfer.transfer_amount) if transfer.transfer_amount else None,
            "transfer_type": transfer.transfer_type,
            "from_institution": transfer.from_institution,
            "to_institution": transfer.to_institution,
            "status": transfer.status,
        },
        "t2220_form": None,
        "mismatches": []
    }

    if t2220:
        comparison["t2220_form"] = {
            "id": t2220.id,
            "form_number": t2220.form_number,
            "account_holder_name": t2220.account_holder_name,
            "account_number_on_form": t2220.account_number_on_form,
            "account_type_on_form": t2220.account_type_on_form,
            "transfer_amount_on_form": float(t2220.transfer_amount_on_form) if t2220.transfer_amount_on_form else None,
            "transfer_type_on_form": t2220.transfer_type_on_form,
            "verified": t2220.verified,
        }

        # Detect mismatches
        if transfer.account_number != t2220.account_number_on_form:
            comparison["mismatches"].append({
                "field": "account_number",
                "atlas_value": transfer.account_number,
                "form_value": t2220.account_number_on_form
            })
        if transfer.account_type != t2220.account_type_on_form:
            comparison["mismatches"].append({
                "field": "account_type",
                "atlas_value": transfer.account_type,
                "form_value": t2220.account_type_on_form
            })
        if transfer.transfer_amount and t2220.transfer_amount_on_form:
            if float(transfer.transfer_amount) != float(t2220.transfer_amount_on_form):
                comparison["mismatches"].append({
                    "field": "transfer_amount",
                    "atlas_value": float(transfer.transfer_amount),
                    "form_value": float(t2220.transfer_amount_on_form)
                })
        if transfer.transfer_type != t2220.transfer_type_on_form:
            comparison["mismatches"].append({
                "field": "transfer_type",
                "atlas_value": transfer.transfer_type,
                "form_value": t2220.transfer_type_on_form
            })

    return comparison
