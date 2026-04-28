"""Resolve a tenant for MCP and scripts: single org + legacy id aliases."""

from sqlalchemy import func
from sqlalchemy.orm import Session

from api import db_models

_LEGACY_IDS = frozenset({"tenant_a", "tenant_b", "default"})


def resolve_tenant_id(db: Session, tenant_id_or_name: str) -> str | None:
    only = db.query(db_models.Tenant).order_by(db_models.Tenant.id).first()
    if not only:
        return None
    key = (tenant_id_or_name or "").strip()
    if not key:
        return only.id
    if key == only.id or key in _LEGACY_IDS:
        return only.id
    if key.lower() == (only.name or "").lower():
        return only.id
    name_row = (
        db.query(db_models.Tenant)
        .filter(func.lower(db_models.Tenant.name) == key.lower())
        .first()
    )
    if name_row is not None:
        return name_row.id
    return None
