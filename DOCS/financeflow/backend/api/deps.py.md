# FastAPI dependencies: DB session and tenant header

**Source file:** `piecemint/backend/api/deps.py`

## Overview

- **`get_tenant_id`**: reads **`X-Tenant-ID`**; returns 400 if missing or blank.

- **`TenantId`**: `Annotated[str, Depends(get_tenant_id)]` for concise route parameters.

- **`DbSession`**: `Annotated[Session, Depends(get_db)]` for SQLAlchemy sessions per request.
