import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean,
    DateTime, ForeignKey, Text, Enum as SAEnum
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


class UserRole(str, enum.Enum):
    manager = "manager"
    head = "head"
    admin = "admin"


class ProposalStatus(str, enum.Enum):
    draft = "draft"
    signed_manager = "signed_manager"
    on_approval = "on_approval"
    signed_head = "signed_head"
    sent_client = "sent_client"
    rejected = "rejected"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    email = Column(String(200), unique=True, index=True, nullable=False)
    password_hash = Column(String(200), nullable=False)
    role = Column(SAEnum(UserRole), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    proposals = relationship("Proposal", back_populates="manager")


class ProductCategory(Base):
    __tablename__ = "product_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    sort_order = Column(Integer, default=0)

    products = relationship("Product", back_populates="category", order_by="Product.name")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("product_categories.id"), nullable=False)
    name = Column(String(300), nullable=False)
    description = Column(Text)
    price = Column(Float, nullable=False)
    unit = Column(String(100), nullable=False)
    currency = Column(String(10), default="KZT")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    category = relationship("ProductCategory", back_populates="products")


class Proposal(Base):
    __tablename__ = "proposals"

    id = Column(Integer, primary_key=True, index=True)
    number = Column(String(50), unique=True, nullable=False)
    manager_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(SAEnum(ProposalStatus), default=ProposalStatus.draft)

    client_company = Column(String(300), nullable=False)
    client_contact = Column(String(200), nullable=False)
    client_email = Column(String(200), nullable=False)
    client_phone = Column(String(50))

    validity_days = Column(Integer, default=30)
    comment = Column(Text)

    subtotal = Column(Float, nullable=False)
    vat_amount = Column(Float, nullable=False)
    total = Column(Float, nullable=False)

    manager_signed_at = Column(DateTime)
    head_signed_at = Column(DateTime)
    head_comment = Column(Text)
    sent_at = Column(DateTime)
    pdf_path = Column(String(500))

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    manager = relationship("User", back_populates="proposals")
    items = relationship("ProposalItem", back_populates="proposal", cascade="all, delete-orphan")
    history = relationship(
        "ProposalHistory", back_populates="proposal",
        cascade="all, delete-orphan", order_by="ProposalHistory.created_at"
    )


class ProposalItem(Base):
    __tablename__ = "proposal_items"

    id = Column(Integer, primary_key=True, index=True)
    proposal_id = Column(Integer, ForeignKey("proposals.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)

    product_name = Column(String(300), nullable=False)
    product_description = Column(Text)
    category_name = Column(String(200))
    unit = Column(String(100), nullable=False)
    price = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    total = Column(Float, nullable=False)

    proposal = relationship("Proposal", back_populates="items")


class ProposalHistory(Base):
    __tablename__ = "proposal_history"

    id = Column(Integer, primary_key=True, index=True)
    proposal_id = Column(Integer, ForeignKey("proposals.id"), nullable=False)
    status = Column(SAEnum(ProposalStatus), nullable=False)
    comment = Column(Text)
    changed_by_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    proposal = relationship("Proposal", back_populates="history")
    changed_by = relationship("User")
