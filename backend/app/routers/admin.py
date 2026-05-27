from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from ..database import get_db
from ..models import Product, ProductCategory
from ..schemas import (
    ProductResponse, ProductCreate, ProductUpdate,
    CategoryWithProducts, CategoryCreate,
)
from ..auth import require_admin

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/categories", response_model=List[CategoryWithProducts])
def list_categories(db: Session = Depends(get_db), _=Depends(require_admin)):
    return (
        db.query(ProductCategory)
        .options(joinedload(ProductCategory.products))
        .order_by(ProductCategory.sort_order)
        .all()
    )


@router.post("/categories", response_model=CategoryWithProducts, status_code=201)
def create_category(body: CategoryCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    cat = ProductCategory(name=body.name, sort_order=body.sort_order)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


@router.get("/products", response_model=List[ProductResponse])
def list_all_products(db: Session = Depends(get_db), _=Depends(require_admin)):
    return db.query(Product).order_by(Product.category_id, Product.name).all()


@router.post("/products", response_model=ProductResponse, status_code=201)
def create_product(body: ProductCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    cat = db.get(ProductCategory, body.category_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Категория не найдена")
    product = Product(**body.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.patch("/products/{product_id}", response_model=ProductResponse)
def update_product(product_id: int, body: ProductUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Продукт не найден")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return product


@router.delete("/products/{product_id}", status_code=204)
def archive_product(product_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Продукт не найден")
    product.is_active = False
    db.commit()
