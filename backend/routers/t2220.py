from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from database import get_db
from models.user import User
from models.t2220_form import T2220Form
from schemas.t2220_form import T2220FormCreate, T2220FormResponse, T2220FormVerify
from auth import get_current_user

router = APIRouter(prefix="/t2220", tags=["T2220 Forms"])


@router.get("/forms", response_model=List[T2220FormResponse])
def get_forms(
    verified: bool = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(T2220Form)

    if verified is not None:
        query = query.filter(T2220Form.verified == verified)

    forms = query.order_by(T2220Form.created_at.desc()).offset(skip).limit(limit).all()
    return forms


@router.get("/forms/{form_id}", response_model=T2220FormResponse)
def get_form(
    form_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    form = db.query(T2220Form).filter(T2220Form.id == form_id).first()
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    return form


@router.get("/forms/transfer/{transfer_id}", response_model=T2220FormResponse)
def get_form_by_transfer(
    transfer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    form = db.query(T2220Form).filter(T2220Form.transfer_id == transfer_id).first()
    if not form:
        raise HTTPException(status_code=404, detail="Form not found for this transfer")
    return form


@router.post("/forms/{form_id}/verify", response_model=T2220FormResponse)
def verify_form(
    form_id: int,
    verify_data: T2220FormVerify,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    form = db.query(T2220Form).filter(T2220Form.id == form_id).first()
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")

    form.verified = verify_data.verified
    form.verification_notes = verify_data.verification_notes
    form.verified_by_id = current_user.id
    form.verified_at = datetime.utcnow()

    db.commit()
    db.refresh(form)
    return form
