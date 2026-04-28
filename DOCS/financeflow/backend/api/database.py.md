# SQLAlchemy engine and session factory

**Source file:** `piecemint/backend/api/database.py`

## Overview

- Defines SQLAlchemy **`Base`**, **`engine`**, and **`SessionLocal`**.

- Default DB: SQLite at `piecemint/backend/piecemint.db` unless `PIECEMINT_DATABASE_URL` is set.

- **`get_db()`** is a FastAPI dependency generator yielding a session (close in `finally`).

- **`init_db()`** imports `api.db_models` (to register tables) and runs `Base.metadata.create_all(bind=engine)`.
