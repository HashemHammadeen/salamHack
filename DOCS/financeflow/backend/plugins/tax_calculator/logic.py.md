# Plugin: tax calculator (endpoint implementation)

**Source file:** `piecemint/backend/plugins/tax_calculator/logic.py`

## Overview

- Router mounted at **`/api/plugins/tax_calculator/...`** (see `plugin_manager` prefix).

- **`GET /tax_calculator/estimate`**: uses **`get_tenant_data`** to sum income transactions and apply `tax_rate` (default 0.2); returns `total_income`, `tax_rate`, `tax_reserve`.
