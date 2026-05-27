from __future__ import annotations
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from .models import UserRole, ProposalStatus


class LoginRequest(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: UserRole
    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class ProductResponse(BaseModel):
    id: int
    category_id: int
    name: str
    description: Optional[str] = None
    price: float
    unit: str
    currency: str
    is_active: bool
    model_config = {"from_attributes": True}


class CategoryWithProducts(BaseModel):
    id: int
    name: str
    sort_order: int
    products: List[ProductResponse]
    model_config = {"from_attributes": True}


class ProductCreate(BaseModel):
    category_id: int
    name: str
    description: Optional[str] = None
    price: float
    unit: str
    currency: str = "KZT"


class ProductUpdate(BaseModel):
    category_id: Optional[int] = None
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    unit: Optional[str] = None
    is_active: Optional[bool] = None


class CategoryCreate(BaseModel):
    name: str
    sort_order: int = 0


class CartItem(BaseModel):
    product_id: int
    quantity: int


class ProposalCreate(BaseModel):
    client_company: str
    client_contact: str
    client_email: str
    client_phone: Optional[str] = None
    validity_days: int = 30
    comment: Optional[str] = None
    items: List[CartItem]


class ProposalItemResponse(BaseModel):
    id: int
    product_id: Optional[int] = None
    product_name: str
    product_description: Optional[str] = None
    category_name: Optional[str] = None
    unit: str
    price: float
    quantity: int
    total: float
    model_config = {"from_attributes": True}


class ProposalHistoryResponse(BaseModel):
    id: int
    status: ProposalStatus
    comment: Optional[str] = None
    changed_by: Optional[UserResponse] = None
    created_at: datetime
    model_config = {"from_attributes": True}


class ProposalResponse(BaseModel):
    id: int
    number: str
    manager: UserResponse
    status: ProposalStatus
    client_company: str
    client_contact: str
    client_email: str
    client_phone: Optional[str] = None
    validity_days: int
    comment: Optional[str] = None
    subtotal: float
    vat_amount: float
    total: float
    manager_signed_at: Optional[datetime] = None
    head_signed_at: Optional[datetime] = None
    head_comment: Optional[str] = None
    sent_at: Optional[datetime] = None
    created_at: datetime
    items: List[ProposalItemResponse]
    history: List[ProposalHistoryResponse]
    model_config = {"from_attributes": True}


class ProposalListItem(BaseModel):
    id: int
    number: str
    manager: UserResponse
    status: ProposalStatus
    client_company: str
    client_email: str
    total: float
    created_at: datetime
    sent_at: Optional[datetime] = None
    model_config = {"from_attributes": True}


class RejectRequest(BaseModel):
    comment: str
