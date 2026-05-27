from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from ..database import get_db
from ..models import Proposal, ProposalItem, ProposalHistory, ProposalStatus, Product, User, UserRole
from ..schemas import (
    ProposalCreate, ProposalResponse, ProposalListItem, RejectRequest
)
from ..auth import get_current_user, require_manager, require_head
from ..services.pdf_service import generate_pdf
from ..services.email_service import notify_head, notify_manager_approved, notify_manager_rejected, send_to_client

router = APIRouter(prefix="/proposals", tags=["proposals"])

VAT_RATE = 0.12


def _proposal_number(db: Session) -> str:
    today = datetime.utcnow()
    prefix = f"КП-{today.year}-{today.month:02d}-{today.day:02d}"
    count = db.query(Proposal).filter(Proposal.number.startswith(prefix)).count()
    return f"{prefix}-{count + 1:03d}"


def _load_proposal(proposal_id: int, db: Session) -> Proposal:
    p = (
        db.query(Proposal)
        .options(
            joinedload(Proposal.manager),
            joinedload(Proposal.items),
            joinedload(Proposal.history).joinedload(ProposalHistory.changed_by),
        )
        .filter(Proposal.id == proposal_id)
        .first()
    )
    if not p:
        raise HTTPException(status_code=404, detail="КП не найдено")
    return p


@router.post("/", response_model=ProposalResponse, status_code=201)
def create_proposal(body: ProposalCreate, db: Session = Depends(get_db), user: User = Depends(require_manager)):
    if not body.items:
        raise HTTPException(status_code=400, detail="Корзина пуста")

    subtotal = 0.0
    item_rows = []
    for cart_item in body.items:
        product = db.get(Product, cart_item.product_id)
        if not product or not product.is_active:
            raise HTTPException(status_code=400, detail=f"Продукт {cart_item.product_id} недоступен")
        item_total = product.price * cart_item.quantity
        subtotal += item_total
        item_rows.append(ProposalItem(
            product_id=product.id,
            product_name=product.name,
            product_description=product.description,
            category_name=product.category.name if product.category else None,
            unit=product.unit,
            price=product.price,
            quantity=cart_item.quantity,
            total=item_total,
        ))

    vat = round(subtotal * VAT_RATE, 2)
    total = round(subtotal + vat, 2)
    subtotal = round(subtotal, 2)

    proposal = Proposal(
        number=_proposal_number(db),
        manager_id=user.id,
        client_company=body.client_company,
        client_contact=body.client_contact,
        client_email=body.client_email,
        client_phone=body.client_phone,
        validity_days=body.validity_days,
        comment=body.comment,
        subtotal=subtotal,
        vat_amount=vat,
        total=total,
        status=ProposalStatus.draft,
    )
    db.add(proposal)
    db.flush()

    for item in item_rows:
        item.proposal_id = proposal.id
        db.add(item)

    db.add(ProposalHistory(
        proposal_id=proposal.id,
        status=ProposalStatus.draft,
        changed_by_id=user.id,
    ))
    db.commit()
    return _load_proposal(proposal.id, db)


@router.get("/", response_model=List[ProposalListItem])
def list_proposals(
    status_filter: Optional[str] = None,
    client: Optional[str] = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    q = db.query(Proposal).options(joinedload(Proposal.manager))
    if user.role == UserRole.manager:
        q = q.filter(Proposal.manager_id == user.id)
    if status_filter:
        q = q.filter(Proposal.status == status_filter)
    if client:
        q = q.filter(Proposal.client_company.ilike(f"%{client}%"))
    proposals = q.order_by(Proposal.created_at.desc()).all()
    return proposals


@router.get("/{proposal_id}", response_model=ProposalResponse)
def get_proposal(proposal_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    p = _load_proposal(proposal_id, db)
    if user.role == UserRole.manager and p.manager_id != user.id:
        raise HTTPException(status_code=403, detail="Нет доступа")
    return p


@router.post("/{proposal_id}/sign-manager", response_model=ProposalResponse)
def sign_manager(proposal_id: int, db: Session = Depends(get_db), user: User = Depends(require_manager)):
    p = _load_proposal(proposal_id, db)
    if p.manager_id != user.id and user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Нет доступа")
    if p.status != ProposalStatus.draft:
        raise HTTPException(status_code=400, detail="КП уже подписано или на согласовании")

    p.manager_signed_at = datetime.utcnow()
    p.status = ProposalStatus.signed_manager
    db.add(ProposalHistory(proposal_id=p.id, status=ProposalStatus.signed_manager, changed_by_id=user.id))

    # Generate PDF
    pdf_path = generate_pdf(p)
    p.pdf_path = pdf_path

    # Move to approval
    p.status = ProposalStatus.on_approval
    db.add(ProposalHistory(proposal_id=p.id, status=ProposalStatus.on_approval, changed_by_id=user.id))
    db.commit()

    notify_head(p)
    return _load_proposal(proposal_id, db)


@router.post("/{proposal_id}/approve", response_model=ProposalResponse)
def approve(proposal_id: int, db: Session = Depends(get_db), user: User = Depends(require_head)):
    p = _load_proposal(proposal_id, db)
    if p.status != ProposalStatus.on_approval:
        raise HTTPException(status_code=400, detail="КП не находится на согласовании")

    p.head_signed_at = datetime.utcnow()
    p.status = ProposalStatus.signed_head
    db.add(ProposalHistory(proposal_id=p.id, status=ProposalStatus.signed_head, changed_by_id=user.id))
    db.commit()

    notify_manager_approved(p)
    return _load_proposal(proposal_id, db)


@router.post("/{proposal_id}/reject", response_model=ProposalResponse)
def reject(proposal_id: int, body: RejectRequest, db: Session = Depends(get_db), user: User = Depends(require_head)):
    p = _load_proposal(proposal_id, db)
    if p.status != ProposalStatus.on_approval:
        raise HTTPException(status_code=400, detail="КП не находится на согласовании")

    p.head_comment = body.comment
    p.status = ProposalStatus.rejected
    db.add(ProposalHistory(
        proposal_id=p.id, status=ProposalStatus.rejected,
        comment=body.comment, changed_by_id=user.id,
    ))
    db.commit()

    notify_manager_rejected(p)
    return _load_proposal(proposal_id, db)


@router.post("/{proposal_id}/resubmit", response_model=ProposalResponse)
def resubmit(proposal_id: int, db: Session = Depends(get_db), user: User = Depends(require_manager)):
    p = _load_proposal(proposal_id, db)
    if p.manager_id != user.id and user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Нет доступа")
    if p.status != ProposalStatus.rejected:
        raise HTTPException(status_code=400, detail="КП не отклонено")

    p.status = ProposalStatus.draft
    p.head_comment = None
    db.add(ProposalHistory(proposal_id=p.id, status=ProposalStatus.draft, changed_by_id=user.id,
                           comment="Повторная отправка после отклонения"))
    db.commit()
    return _load_proposal(proposal_id, db)


@router.post("/{proposal_id}/send", response_model=ProposalResponse)
def send_proposal(proposal_id: int, db: Session = Depends(get_db), user: User = Depends(require_manager)):
    p = _load_proposal(proposal_id, db)
    if p.manager_id != user.id and user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Нет доступа")
    if p.status != ProposalStatus.signed_head:
        raise HTTPException(status_code=400, detail="КП ещё не подписано руководителем")

    p.sent_at = datetime.utcnow()
    p.status = ProposalStatus.sent_client
    db.add(ProposalHistory(proposal_id=p.id, status=ProposalStatus.sent_client, changed_by_id=user.id))
    db.commit()

    send_to_client(p)
    return _load_proposal(proposal_id, db)


@router.get("/{proposal_id}/pdf")
def download_pdf(proposal_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    p = db.get(Proposal, proposal_id)
    if not p:
        raise HTTPException(status_code=404, detail="КП не найдено")
    if user.role == UserRole.manager and p.manager_id != user.id:
        raise HTTPException(status_code=403, detail="Нет доступа")
    if not p.pdf_path:
        raise HTTPException(status_code=404, detail="PDF ещё не сгенерирован")
    return FileResponse(p.pdf_path, media_type="application/pdf", filename=f"{p.number}.pdf")
