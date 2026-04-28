# Plugin: AI cashflow forecast (optional / disabled copy)

**Source file:** `piecemint/backend/disabled_plugins/ai_prediction/logic.py`

## Overview

- Same role as a plugin under `plugins/`, but this copy lives in **`disabled_plugins/`** so it does not load until moved.

- **`GET /ai_prediction/forecast`**: Pandas groups transactions by month, mean monthly flow, projects three future months (moving-average style).
