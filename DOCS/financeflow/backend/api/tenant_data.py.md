# Read model for plugins (dict compatibility)

**Source file:** `financeflow/backend/api/tenant_data.py`

## Overview

- **`ensure_tenant_row`**: creates a `Tenant` row on the fly if an unknown `tenant_id` is used (keeps old "auto tenant" behavior).

- **`get_tenant_data(db, tenant_id)`** returns a dict with `clients`, `suppliers`, `transactions` as lists of plain dicts—same structure the original mock `DB` used.

- Imported by plugin `logic.py` files for tax, expenses, and AI without duplicating query logic.
