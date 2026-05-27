from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from typing import List
from ..database import get_db
from ..models import ProductCategory, Product
from ..schemas import CategoryWithProducts
from ..auth import get_current_user

router = APIRouter(prefix="/catalog", tags=["catalog"])


@router.get("/", response_model=List[CategoryWithProducts])
def get_catalog(db: Session = Depends(get_db), _=Depends(get_current_user)):
    categories = (
        db.query(ProductCategory)
        .options(joinedload(ProductCategory.products))
        .order_by(ProductCategory.sort_order)
        .all()
    )
    result = []
    for cat in categories:
        active_products = [p for p in cat.products if p.is_active]
        if active_products:
            result.append(CategoryWithProducts(
                id=cat.id,
                name=cat.name,
                sort_order=cat.sort_order,
                products=[p for p in cat.products if p.is_active],
            ))
    return result
