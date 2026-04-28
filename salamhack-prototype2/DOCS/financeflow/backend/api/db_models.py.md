# ORM models: multi-tenant tables

**Source file:** `piecemint/backend/api/db_models.py`

## Overview

- **`Tenant`**: master row (`id`, `name`). Other tables reference `tenant_id` with `ForeignKey` + cascade delete.

- **`Client`**, **`Supplier`**, **`Transaction`**, **`Stockholder`**: each includes `tenant_id` and business fields matching the API/seed data.

- **`Transaction`**: stores `date` / `last_activity` as strings (ISO dates) for simple JSON alignment with the frontend.

- Uses SQLAlchemy 2.0 `Mapped[]` / `mapped_column` style.
