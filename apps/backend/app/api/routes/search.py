from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services import search_service

router = APIRouter(prefix="/search", tags=["search"])


@router.get("")
def search(
    q: Annotated[str, Query(min_length=1, max_length=200)] = "",
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    db: Session = Depends(get_db),
):
    return search_service.search(db, q, limit=limit)
