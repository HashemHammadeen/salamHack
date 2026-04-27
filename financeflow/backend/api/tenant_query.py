"""Resolve a tenant for MCP and scripts by id or display name (case-insensitive)."""

from sqlalchemy import func
from sqlalchemy.orm import Session

from api import db_models


def resolve_tenant_id(db: Session, tenant_id_or_name: str) -> str | None:
    key = (tenant_id_or_name or "").strip()
    if not key:
        return None
    row = db.get(db_models.Tenant, key)
    if row is not None:
        return row.id
    name_row = (
        db.query(db_models.Tenant)
        .filter(func.lower(db_models.Tenant.name) == key.lower())
        .first()
    )
    if name_row is not None:
        return name_row.id
    return None
