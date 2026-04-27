# FastAPI application entrypoint

**Source file:** `financeflow/backend/api/main.py`

## Overview

- Creates the `FastAPI` app, registers CORS, runs **lifespan**: `init_db()` + `ensure_seed_data()` on startup.

- Loads **PluginManager**: discovers `plugins/*/`, registers each plugin router under `/api/plugins`.

- Mounts **core_router** (`/api/core/*`) and defines `GET /` and `GET /api/plugins` (installed vs available plugin metadata).

- Run with: `uvicorn api.main:app` from `financeflow/backend`.
