"""
Verification script: create a dummy transaction via crud.py, read it back,
assert values match, then clean up.

Usage:
    cd backend
    .\\venv\\Scripts\\python -m api.verify_write
"""

from __future__ import annotations

import sys
import uuid

from api.database import SessionLocal, init_db
from api import crud
from api.models import TransactionCreate


MARKER = f"VERIFY_{uuid.uuid4().hex[:8]}"


def main() -> None:
    init_db()
    db = SessionLocal()
    tenant_id = "default"
    created_id: str | None = None

    try:
        # ── Step 1: Create ──────────────────────────────────────────────
        print(f"[1/4] Creating test transaction (marker={MARKER}) ... ", end="", flush=True)
        data = TransactionCreate(
            amount=42.00,
            date="2026-04-28",
            type="income",
            category=MARKER,
            is_recurring=False,
        )
        row = crud.create_transaction(db, tenant_id, data)
        created_id = row.id
        print(f"OK  (id={created_id})")

        # ── Step 2: Read back ───────────────────────────────────────────
        print("[2/4] Reading back from DB ... ", end="", flush=True)
        fetched = crud.get_transaction(db, tenant_id, created_id)
        assert fetched is not None, "Transaction not found after insert!"
        print("OK")

        # ── Step 3: Assert ──────────────────────────────────────────────
        print("[3/4] Asserting values match ... ", end="", flush=True)
        assert fetched.amount == 42.00, f"Amount mismatch: {fetched.amount}"
        assert fetched.date == "2026-04-28", f"Date mismatch: {fetched.date}"
        assert fetched.type == "income", f"Type mismatch: {fetched.type}"
        assert fetched.category == MARKER, f"Category mismatch: {fetched.category}"
        assert fetched.is_recurring is False, f"Recurring mismatch: {fetched.is_recurring}"
        print("OK  (all fields correct)")

        # ── Step 4: Cleanup ─────────────────────────────────────────────
        print("[4/4] Cleaning up test row ... ", end="", flush=True)
        deleted = crud.delete_transaction(db, tenant_id, created_id)
        assert deleted, "Failed to delete test transaction!"
        created_id = None  # mark as cleaned
        print("OK")

        # ── Row counts ──────────────────────────────────────────────────
        counts = crud.count_all(db, tenant_id)
        print(f"\n{'='*50}")
        print(f"  [PASS] write roundtrip verified successfully")
        print(f"  DB row counts: {counts}")
        print(f"{'='*50}")

    except Exception as exc:
        print(f"\n{'='*50}")
        print(f"  [FAIL] {exc}")
        print(f"{'='*50}")
        sys.exit(1)

    finally:
        # Safety net: clean up if assertion failed mid-way
        if created_id is not None:
            try:
                crud.delete_transaction(db, tenant_id, created_id)
            except Exception:
                pass
        db.close()


if __name__ == "__main__":
    main()
