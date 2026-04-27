# Core REST API (tenant-scoped)

**Source file:** `financeflow/backend/api/core_routes.py`

## Overview

- Router prefix: `/api/core`.

- Uses **`DbSession`** and **`TenantId`** dependencies: data is filtered by `X-Tenant-ID` for every tenant-bound row.

- `GET /tenants` lists all tenants (no tenant header required) for discovery/admin.

- Exposes CRUD-style routes for **clients**, **suppliers**, **transactions**, and **stockholders** against SQLAlchemy models.

- Returns Pydantic models from `api/models.py` for OpenAPI-friendly responses.
