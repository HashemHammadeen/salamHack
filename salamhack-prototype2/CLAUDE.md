# FinanceFlow — Claude Code Command Center

> React + FastAPI fintech tool with SQLAlchemy/SQLite.  
> All data operations go through `api/crud.py`.

---

## Quick Start

```bash
# Backend (FastAPI + SQLite)
cd financeflow/backend
.\venv\Scripts\activate          # Windows venv
uvicorn api.main:app --reload    # http://localhost:8000

# Frontend (Vite + React)
cd financeflow/frontend
npm run dev                      # http://localhost:5173
```

---

## Architecture (MVC)

| Layer        | File                     | Role                                         |
|--------------|--------------------------|----------------------------------------------|
| **Model**    | `api/db_models.py`       | SQLAlchemy ORM classes                       |
| **View/DTO** | `api/models.py`          | Pydantic schemas (Create, Update, Read)      |
| **Controller**| `api/core_routes.py`    | FastAPI router — thin wrappers over crud     |
| **CRUD**     | `api/crud.py`            | All data logic (list/get/create/update/delete)|
| **DB**       | `financeflow.db`         | SQLite single-file database                  |
| **Seed**     | `api/seed.py`            | Demo data seeder                             |

---

## Data Fix Shortcuts

```bash
# Reseed the entire database (wipe + repopulate demo data)
cd financeflow/backend
.\venv\Scripts\python -m api.seed --force

# Verify a write roundtrip (create → read → assert → cleanup)
.\venv\Scripts\python -m api.verify_write

# Quick transaction via curl (server must be running)
curl -X POST http://localhost:8000/api/core/transactions \
  -H "Content-Type: application/json" \
  -d '{"amount": 999.99, "date": "2026-04-28", "type": "income", "category": "Test"}'

# Patch a transaction
curl -X PATCH http://localhost:8000/api/core/transactions/<TX_ID> \
  -H "Content-Type: application/json" \
  -d '{"amount": 1234.56}'

# Delete a transaction
curl -X DELETE http://localhost:8000/api/core/transactions/<TX_ID>

# Count all rows per entity (via Python)
.\venv\Scripts\python -c "from api.database import SessionLocal, init_db; from api.crud import count_all; init_db(); db=SessionLocal(); print(count_all(db,'default')); db.close()"
```

---

## Entities

| Entity        | Model Class     | Endpoints                              |
|---------------|-----------------|----------------------------------------|
| Transaction   | `Transaction`   | GET/POST/PATCH/DELETE `/api/core/transactions` |
| Client        | `Client`        | GET/POST/PATCH/DELETE `/api/core/clients`      |
| Supplier      | `Supplier`      | GET/POST/PATCH/DELETE `/api/core/suppliers`     |
| Stockholder   | `Stockholder`   | GET/POST/PATCH/DELETE `/api/core/stockholders`  |

All endpoints are tenant-scoped (single org `"default"` — no auth required).

---

## File Layout

```
financeflow/
├── backend/
│   ├── api/
│   │   ├── crud.py            ← CRUD layer (source of truth)
│   │   ├── core_routes.py     ← REST endpoints
│   │   ├── db_models.py       ← SQLAlchemy models
│   │   ├── models.py          ← Pydantic schemas
│   │   ├── database.py        ← Engine, SessionLocal, Base
│   │   ├── deps.py            ← DI (DbSession, TenantId)
│   │   ├── seed.py            ← Demo data seeder
│   │   ├── verify_write.py    ← Write verification script
│   │   └── main.py            ← FastAPI app entry
│   ├── plugins/               ← Plugin system
│   ├── financeflow.db         ← SQLite database
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── pages/             ← React pages
    │   ├── components/        ← Shared components
    │   ├── services/          ← API client
    │   └── types/             ← TypeScript types
    └── package.json
```
