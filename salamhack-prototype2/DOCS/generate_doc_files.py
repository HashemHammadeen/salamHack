#!/usr/bin/env python3
"""One-off generator: creates DOCS/piecemint/**/<name>.md for each mapped source file."""
from __future__ import annotations

import os

ROOT = os.path.dirname(os.path.abspath(__file__))
DOCS = os.path.join(ROOT, "piecemint")

# relpath under piecemint/ -> (title, sections as list of str)
SPECS: dict[str, tuple[str, list[str]]] = {
    "backend/api/__init__.py": (
        "Package marker: `api`",
        [
            "Marks `api` as a Python package so imports like `from api.main import app` resolve when the backend working directory is `piecemint/backend`.",
            "No runtime logic; safe to leave minimal or empty.",
        ],
    ),
    "backend/api/main.py": (
        "FastAPI application entrypoint",
        [
            "Creates the `FastAPI` app, registers CORS, runs **lifespan**: `init_db()` + `ensure_seed_data()` on startup.",
            "Loads **PluginManager**: discovers `plugins/*/`, registers each plugin router under `/api/plugins`.",
            "Mounts **core_router** (`/api/core/*`) and defines `GET /` and `GET /api/plugins` (installed vs available plugin metadata).",
            "Run with: `uvicorn api.main:app` from `piecemint/backend`.",
        ],
    ),
    "backend/api/core_routes.py": (
        "Core REST API (tenant-scoped)",
        [
            "Router prefix: `/api/core`.",
            "Uses **`DbSession`** and **`TenantId`** dependencies: data is filtered by `X-Tenant-ID` for every tenant-bound row.",
            "`GET /tenants` lists all tenants (no tenant header required) for discovery/admin.",
            "Exposes CRUD-style routes for **clients**, **suppliers**, **transactions**, and **stockholders** against SQLAlchemy models.",
            "Returns Pydantic models from `api/models.py` for OpenAPI-friendly responses.",
        ],
    ),
    "backend/api/database.py": (
        "SQLAlchemy engine and session factory",
        [
            "Defines SQLAlchemy **`Base`**, **`engine`**, and **`SessionLocal`**.",
            "Default DB: SQLite at `piecemint/backend/piecemint.db` unless `PIECEMINT_DATABASE_URL` is set.",
            "**`get_db()`** is a FastAPI dependency generator yielding a session (close in `finally`).",
            "**`init_db()`** imports `api.db_models` (to register tables) and runs `Base.metadata.create_all(bind=engine)`.",
        ],
    ),
    "backend/api/db_models.py": (
        "ORM models: multi-tenant tables",
        [
            "**`Tenant`**: master row (`id`, `name`). Other tables reference `tenant_id` with `ForeignKey` + cascade delete.",
            "**`Client`**, **`Supplier`**, **`Transaction`**, **`Stockholder`**: each includes `tenant_id` and business fields matching the API/seed data.",
            "**`Transaction`**: stores `date` / `last_activity` as strings (ISO dates) for simple JSON alignment with the frontend.",
            "Uses SQLAlchemy 2.0 `Mapped[]` / `mapped_column` style.",
        ],
    ),
    "backend/api/deps.py": (
        "FastAPI dependencies: DB session and tenant header",
        [
            "**`get_tenant_id`**: reads **`X-Tenant-ID`**; returns 400 if missing or blank.",
            "**`TenantId`**: `Annotated[str, Depends(get_tenant_id)]` for concise route parameters.",
            "**`DbSession`**: `Annotated[Session, Depends(get_db)]` for SQLAlchemy sessions per request.",
        ],
    ),
    "backend/api/models.py": (
        "Pydantic request/response models",
        [
            "Defines API shapes: **`Client`**, **`Supplier`**, **`Transaction`**, **`Stockholder`**, plus **`*Create`** bodies where applicable.",
            "**`TenantInfo`**: `id` + `name` for `GET /api/core/tenants`.",
            "Used for response validation and OpenAPI schema in `core_routes.py`.",
        ],
    ),
    "backend/api/seed.py": (
        "Initial data seed (idempotent)",
        [
            "**`ensure_seed_data(db)`** runs only when the `tenants` table is empty.",
            "Inserts `tenant_a` (Acme Corp) and `tenant_b` (Stark Industries) with sample clients, suppliers, transactions, and one stockholder for tenant A.",
            "Called from **`api/main.py`** lifespan at startup so demos work without manual SQL.",
        ],
    ),
    "backend/api/tenant_data.py": (
        "Read model for plugins (dict compatibility)",
        [
            "**`ensure_tenant_row`**: creates a `Tenant` row on the fly if an unknown `tenant_id` is used (keeps old \"auto tenant\" behavior).",
            "**`get_tenant_data(db, tenant_id)`** returns a dict with `clients`, `suppliers`, `transactions` as lists of plain dicts—same structure the original mock `DB` used.",
            "Imported by plugin `logic.py` files for tax, expenses, and AI without duplicating query logic.",
        ],
    ),
    "backend/api/tenant_query.py": (
        "Tenant resolution for MCP and scripts",
        [
            "**`resolve_tenant_id(db, tenant_id_or_name)`** finds a tenant by **primary id** (e.g. `tenant_a`) or by **case-insensitive display `name`** (e.g. `Acme Corp`).",
            "Used by **`mcp_server.py`** so tools can accept either form from an LLM.",
        ],
    ),
    "backend/plugin_manager.py": (
        "Dynamic plugin discovery and registration",
        [
            "Scans **`plugins/`** for subfolders containing **`manifest.yaml`** and **`logic.py`**.",
            "Loads each `logic` module and collects **`router`** objects; registers them on the app with prefix **`/api/plugins`**.",
            "**`get_installed_plugins()`** re-reads the filesystem for the marketplace UI; **`get_available_plugins()`** lists folders under **`disabled_plugins/`**.",
            "Note: moving a plugin only updates routes after the app process reloads; the plugin **list** can update without restart.",
        ],
    ),
    "backend/mcp_server.py": (
        "MCP (Model Context Protocol) stdio server",
        [
            "Uses **`mcp.server.fastmcp.FastMCP`** with **`mcp.run()`** (stdio transport) for Cursor/Claude Desktop style hosts.",
            "Shares the same SQLite file as the FastAPI app via **`api.database`**.",
            "Tools: **`list_tenants`**, **`get_clients`**, **`get_stockholders`**, **`add_stockholder`**, **`list_transactions`**—resolve tenant by id or name.",
            "Entry: `python mcp_server.py` from `piecemint/backend` (with venv activated).",
        ],
    ),
    "backend/requirements.txt": (
        "Python dependencies (backend)",
        [
            "Pinned/minimum versions for: FastAPI, Uvicorn, Pydantic, PyYAML, ReportLab, Pandas, SQLAlchemy, MCP, HTTPX, etc.",
            "Install: `pip install -r requirements.txt` inside the backend virtual environment.",
        ],
    ),
    "backend/plugins/tax_calculator/logic.py": (
        "Plugin: tax calculator (endpoint implementation)",
        [
            "Router mounted at **`/api/plugins/tax_calculator/...`** (see `plugin_manager` prefix).",
            "**`GET /tax_calculator/estimate`**: uses **`get_tenant_data`** to sum income transactions and apply `tax_rate` (default 0.2); returns `total_income`, `tax_rate`, `tax_reserve`.",
        ],
    ),
    "backend/plugins/tax_calculator/manifest.yaml": (
        "Plugin: tax calculator (manifest)",
        [
            "Metadata: `name`, `description`, `version` for the marketplace and discovery list.",
        ],
    ),
    "backend/plugins/invoice_gen/logic.py": (
        "Plugin: PDF invoice generation",
        [
            "**`GET /invoice_gen/generate/{client_id}`** loads a **`Client`** for the current tenant, returns **`application/pdf`** (ReportLab canvas).",
            "404 if the client id does not exist for that tenant.",
        ],
    ),
    "backend/plugins/invoice_gen/manifest.yaml": (
        "Plugin: invoice generator (manifest)",
        [
            "Metadata for the Invoice Generator plugin in **`/api/plugins`** listing.",
        ],
    ),
    "backend/plugins/expense_categorizer/logic.py": (
        "Plugin: keyword-based expense search",
        [
            "**`GET /expense_categorizer/search?query=...`**: filters expense transactions using simple keyword rules (e.g. \"cloud\" → AWS/Azure/Vercel).",
            "Uses **`get_tenant_data`** for a consistent read model across tenants.",
        ],
    ),
    "backend/plugins/expense_categorizer/manifest.yaml": (
        "Plugin: Smart Categorizer (manifest)",
        [
            "Metadata for the Smart Categorizer plugin.",
        ],
    ),
    "backend/disabled_plugins/ai_prediction/logic.py": (
        "Plugin: AI cashflow forecast (optional / disabled copy)",
        [
            "Same role as a plugin under `plugins/`, but this copy lives in **`disabled_plugins/`** so it does not load until moved.",
            "**`GET /ai_prediction/forecast`**: Pandas groups transactions by month, mean monthly flow, projects three future months (moving-average style).",
        ],
    ),
    "backend/disabled_plugins/ai_prediction/manifest.yaml": (
        "Plugin: AI prediction (manifest, disabled copy)",
        [
            "Metadata used when the folder is under `plugins/` or when documenting available vs installed in `disabled_plugins/`.",
        ],
    ),
    "frontend/index.html": (
        "Vite HTML shell",
        [
            "Root document for the SPA: mounts **`src/main.tsx`**, includes page title and favicon link.",
            "Vite injects the bundled script during `npm run build` / dev server.",
        ],
    ),
    "frontend/package.json": (
        "npm package manifest (frontend)",
        [
            "Scripts: `dev`, `build`, `lint`, `preview`.",
            "Dependencies: React, Vite, TypeScript, Tailwind v4 (`@tailwindcss/vite`), Recharts, Axios, React Router, Lucide icons.",
        ],
    ),
    "frontend/package-lock.json": (
        "npm lockfile",
        [
            "Exact resolved versions of the dependency tree. **Do not hand-edit**; regenerate with `npm install`.",
            "Commit in version control for reproducible installs across machines and CI.",
        ],
    ),
    "frontend/README.md": (
        "Create Vite + React template README (upstream)",
        [
            "This file in `piecemint/frontend/` is the default Vite React-TS README from the scaffold (dev commands, Vite links).",
            "For Piecemint-specific architecture, see `DOCS/piecemint/README.md` and the per-file `*.md` files in this tree.",
        ],
    ),
    "frontend/vite.config.ts": (
        "Vite configuration",
        [
            "Registers **`@vitejs/plugin-react`** and **`@tailwindcss/vite`** for Tailwind 4 single-file CSS pipeline.",
            "Standard `defineConfig` export for the Piecemint frontend build.",
        ],
    ),
    "frontend/tsconfig.json": (
        "TypeScript project references (root)",
        [
            "Points to **`tsconfig.app.json`** and **`tsconfig.node.json`** via `references` (solution-style layout).",
        ],
    ),
    "frontend/tsconfig.app.json": (
        "TypeScript config for application source",
        [
            "Compiler options for **`src/**`**: JSX, module resolution, strictness suitable for the React app.",
        ],
    ),
    "frontend/tsconfig.node.json": (
        "TypeScript config for Node tooling (Vite config, etc.)",
        [
            "Separate smaller options scope for Vite/Node-side TS files (e.g. `vite.config.ts`).",
        ],
    ),
    "frontend/tailwind.config.js": (
        "Tailwind theme extension (v3-style file; v4 may also use CSS `@theme`)",
        [
            "Extends `theme` with Piecemint color tokens: canvas cream, lifted cream, ink black, signal orange, etc.",
            "If using Tailwind v4 with `@import \"tailwindcss\"` in CSS, this file may be partially redundant; kept for editor/tooling compatibility in some setups.",
        ],
    ),
    "frontend/eslint.config.js": (
        "ESLint flat config",
        [
            "Lint rules for TypeScript + React; used by `npm run lint` and the IDE.",
        ],
    ),
    "frontend/src/main.tsx": (
        "React bootstrap",
        [
            "Creates the root with **`createRoot`**, imports **`index.css`**, renders **`<App />`** in strict mode.",
        ],
    ),
    "frontend/src/index.css": (
        "Global styles and design system base",
        [
            "Imports **Google Font (Sofia Sans)** and Tailwind 4: **`@import \"tailwindcss\"`**.",
            "Defines **CSS variables** and `@theme` colors aligned with the Mastercard-inspired design doc.",
            "Utility classes: **`.pill-button`**, **`.card`**, **`.nav-pill`**, etc., shared across pages.",
        ],
    ),
    "frontend/src/App.css": (
        "Component-scoped default styles (Vite template)",
        [
            "Default Vite/React starter rules for the root logo layout; the app may rely more on `index.css` and Tailwind.",
            "Safe to trim if unused, but still part of the scaffold.",
        ],
    ),
    "frontend/src/App.tsx": (
        "Root React component: shell and routes",
        [
            "Wraps the app in **`BrowserRouter`**, provides floating **nav pill** with tenant dropdown and links to **Dashboard** and **Plugins (Marketplace)**.",
            "Passes **`tenantId`** to routed pages; API calls in children should send **`X-Tenant-ID`** to match the backend.",
        ],
    ),
    "frontend/src/pages/Dashboard.tsx": (
        "Main dashboard page",
        [
            "Fetches core data (`/api/core/*`) and plugin status (`/api/plugins`), then optional plugin calls (tax, forecast, expenses, PDF invoice).",
            "Implements **KPIs**, Recharts **area/bar** charts (cashflow, inflow vs outflow, category, clients, suppliers), **zombie subscription** cards, and CRM tables.",
            "Uses `http://localhost:8000/api` as base URL unless changed for deployment.",
        ],
    ),
    "frontend/src/pages/Marketplace.tsx": (
        "Plugin marketplace page",
        [
            "Calls **`GET /api/plugins`** to show installed vs available plugins (filesystem-driven lists from the backend).",
            "No tenant header required for the plugin list endpoint.",
        ],
    ),
    "frontend/public/favicon.svg": (
        "Favicon (SVG asset)",
        [
            "Served as `/favicon.svg` from the static `public/` folder. Referenced in `index.html` for browser tab icon.",
        ],
    ),
    "frontend/public/icons.svg": (
        "Sprite or icon set (SVG asset)",
        [
            "Static asset under `public/`; may be used for app icons or embedded symbols depending on the template setup.",
        ],
    ),
}


def main() -> None:
    for rel, (title, bullets) in SPECS.items():
        path = os.path.join(DOCS, rel)
        parent = os.path.dirname(path)
        base = os.path.basename(rel)  # e.g. main.py, App.tsx, README.md
        # Unambiguous: main.py -> main.py.md, App.tsx -> App.tsx.md (avoids App.css vs App.tsx clash)
        if base.endswith(".md") and "README" in base.upper():
            out = os.path.join(parent, base)  # README.md about README
        else:
            out = os.path.join(parent, f"{base}.md")

        os.makedirs(os.path.dirname(out), exist_ok=True)
        lines = [
            f"# {title}",
            "",
            f"**Source file:** `piecemint/{rel}`",
            "",
            "## Overview",
            "",
        ]
        for b in bullets:
            lines.append(f"- {b}")
            lines.append("")
        body = "\n".join(lines).rstrip() + "\n"
        with open(out, "w", encoding="utf-8") as f:
            f.write(body)
        print("wrote", out)

    # Index README in DOCS/piecemint
    index_path = os.path.join(DOCS, "README.md")
    with open(index_path, "w", encoding="utf-8") as f:
        f.write(
            """# Piecemint documentation mirror

This folder mirrors the `piecemint/` project tree. For each **source file** in the repo, a documentation file here explains that file’s role.

## Naming

- Doc files are named **`<original-filename>.md`** (for example `main.py.md`, `Dashboard.tsx.md`) so names stay unique in folders that contain both `App.css` and `App.tsx`.
- **Exception:** `README.md` in this tree documents the corresponding `README.md` under `piecemint/`.

## Excluded (by design)

`node_modules/`, `venv/`, `dist/`, `__pycache__/`, and other generated or vendor content are not documented here.

## Regenerating

Run `python3 DOCS/generate_doc_files.py` from the repository root, and extend the `SPECS` map in that script when you add new source files.

"""
        )
    print("wrote", index_path)


if __name__ == "__main__":
    main()
