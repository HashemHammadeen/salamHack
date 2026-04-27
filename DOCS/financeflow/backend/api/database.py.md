# SQLAlchemy engine and session factory

**Source file:** `financeflow/backend/api/database.py`

## Overview

- Defines SQLAlchemy **`Base`**, **`engine`**, and **`SessionLocal`**.

- Default DB: SQLite at `financeflow/backend/financeflow.db` unless `FINANCEFLOW_DATABASE_URL` is set.

- **`get_db()`** is a FastAPI dependency generator yielding a session (close in `finally`).

- **`init_db()`** imports `api.db_models` (to register tables) and runs `Base.metadata.create_all(bind=engine)`.
