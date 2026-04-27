"""
Database seeding: demo data for all finance tables (tenants, clients, suppliers, transactions, stockholders).

* On API startup, `ensure_seed_data` runs once if the DB is empty.
* For a full reseed: `cd backend && python -m api.seed --force` (wipes and repopulates).
"""

from __future__ import annotations

import argparse
import sys
from sqlalchemy.orm import Session

from api import db_models
from api.mock_finance_data import all_seed_rows


def wipe_all(db: Session) -> None:
    """Delete all finance rows in FK-safe order (SQLite / Postgres)."""
    db.query(db_models.Transaction).delete()
    db.query(db_models.Stockholder).delete()
    db.query(db_models.Client).delete()
    db.query(db_models.Supplier).delete()
    db.query(db_models.Tenant).delete()
    db.commit()


def populate_mock_data(db: Session) -> None:
    for row in all_seed_rows():
        db.add(row)
    db.commit()


def ensure_seed_data(db: Session) -> None:
    """Idempotent: only inserts when the tenants table is empty."""
    if db.query(db_models.Tenant).first() is not None:
        return
    populate_mock_data(db)


def reseed_force(db: Session) -> None:
    """Clear all business data and insert the full mock dataset."""
    wipe_all(db)
    populate_mock_data(db)


def _cli() -> None:
    from api.database import SessionLocal, init_db

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--force",
        action="store_true",
        help="Wipe existing data and re-insert mock rows (DANGER: deletes all finance data).",
    )
    args = parser.parse_args()

    init_db()
    db = SessionLocal()
    try:
        if args.force:
            reseed_force(db)
            print("Database reseeded with mock data.", file=sys.stderr)
        else:
            ensure_seed_data(db)
            if db.query(db_models.Tenant).count() == 0:
                print("No seed applied (tenants still empty).", file=sys.stderr)
            else:
                n = (
                    db.query(db_models.Tenant).count()
                    + db.query(db_models.Client).count()
                    + db.query(db_models.Supplier).count()
                    + db.query(db_models.Transaction).count()
                    + db.query(db_models.Stockholder).count()
                )
                print(
                    f"ensure_seed: OK (total rows in finance tables: {n})."
                    " Use --force to replace all data.",
                    file=sys.stderr,
                )
    finally:
        db.close()
    sys.exit(0)


if __name__ == "__main__":
    _cli()
