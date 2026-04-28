# Plugin: keyword-based expense search

**Source file:** `piecemint/backend/plugins/expense_categorizer/logic.py`

## Overview

- **`GET /expense_categorizer/search?query=...`**: filters expense transactions using simple keyword rules (e.g. "cloud" → AWS/Azure/Vercel).

- Uses **`get_tenant_data`** for a consistent read model across tenants.
