from fastapi import APIRouter

from app.documents import REGISTRY
from app.schemas import CatalogEntry

router = APIRouter()


@router.get("", response_model=list[CatalogEntry])
def get_catalog():
    """Return all supported document types."""
    return [
        CatalogEntry(key=spec.key, name=spec.name, description=spec.description)
        for spec in REGISTRY.values()
    ]
