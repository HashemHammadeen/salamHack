from typing import Annotated

from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from api.database import get_db


def get_tenant_id(
    x_tenant_id: str | None = Header(default=None, alias="X-Tenant-ID"),
) -> str:
    """Resolves the active tenant from the `X-Tenant-ID` header (HTTP headers are case-insensitive)."""
    if not x_tenant_id or not str(x_tenant_id).strip():
        raise HTTPException(
            status_code=400,
            detail="Missing X-Tenant-ID header. Send a tenant id (e.g. tenant_a) for multi-tenant scoping.",
        )
    return str(x_tenant_id).strip()


TenantId = Annotated[str, Depends(get_tenant_id)]
DbSession = Annotated[Session, Depends(get_db)]
