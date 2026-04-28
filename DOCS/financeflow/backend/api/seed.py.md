# Initial data seed (idempotent)

**Source file:** `piecemint/backend/api/seed.py`

## Overview

- **`ensure_seed_data(db)`** runs only when the `tenants` table is empty.

- Inserts `tenant_a` (Acme Corp) and `tenant_b` (Stark Industries) with sample clients, suppliers, transactions, and one stockholder for tenant A.

- Called from **`api/main.py`** lifespan at startup so demos work without manual SQL.
