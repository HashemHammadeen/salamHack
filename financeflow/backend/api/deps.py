from typing import Annotated

from fastapi import Depends
from sqlalchemy.orm import Session

from api.database import get_db
from api.tenant_scope import DEFAULT_TENANT_ID


def get_tenant_id() -> str:
    """Piecemint is single-organization; always scope to the default org."""
    return DEFAULT_TENANT_ID


TenantId = Annotated[str, Depends(get_tenant_id)]
DbSession = Annotated[Session, Depends(get_db)]
