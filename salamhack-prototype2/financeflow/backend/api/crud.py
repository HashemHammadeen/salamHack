"""
Centralized CRUD data-access layer for all Piecemint entities.

Routes, scripts, and CLI tools all funnel through this module so
business logic lives in one place.
"""

from __future__ import annotations

from typing import Sequence

from sqlalchemy.orm import Session

from api import db_models
from api.models import (
    ClientCreate,
    ClientUpdate,
    StockholderCreate,
    StockholderUpdate,
    SupplierCreate,
    SupplierUpdate,
    TransactionCreate,
    TransactionUpdate,
)


# ---------------------------------------------------------------------------
# Transactions
# ---------------------------------------------------------------------------

def list_transactions(
    db: Session,
    tenant_id: str,
) -> Sequence[db_models.Transaction]:
    return (
        db.query(db_models.Transaction)
        .filter(db_models.Transaction.tenant_id == tenant_id)
        .order_by(db_models.Transaction.date)
        .all()
    )


def get_transaction(
    db: Session,
    tenant_id: str,
    tx_id: str,
) -> db_models.Transaction | None:
    return (
        db.query(db_models.Transaction)
        .filter(
            db_models.Transaction.id == tx_id,
            db_models.Transaction.tenant_id == tenant_id,
        )
        .first()
    )


def create_transaction(
    db: Session,
    tenant_id: str,
    data: TransactionCreate,
) -> db_models.Transaction:
    t = db_models.Transaction(
        tenant_id=tenant_id,
        amount=data.amount,
        date=data.date,
        type=data.type,
        category=data.category,
        is_recurring=data.is_recurring,
        last_activity=data.last_activity or data.date,
    )
    db.add(t)
    db.commit()
    db.refresh(t)
    return t


def update_transaction(
    db: Session,
    tenant_id: str,
    tx_id: str,
    data: TransactionUpdate,
) -> db_models.Transaction | None:
    t = get_transaction(db, tenant_id, tx_id)
    if t is None:
        return None
    patch = data.model_dump(exclude_unset=True)
    for field, value in patch.items():
        setattr(t, field, value)
    if "date" in patch and "last_activity" not in patch:
        t.last_activity = patch["date"]
    db.commit()
    db.refresh(t)
    return t


def delete_transaction(
    db: Session,
    tenant_id: str,
    tx_id: str,
) -> bool:
    t = get_transaction(db, tenant_id, tx_id)
    if t is None:
        return False
    db.delete(t)
    db.commit()
    return True


def bulk_create_transactions(
    db: Session,
    tenant_id: str,
    items: list[TransactionCreate],
) -> list[db_models.Transaction]:
    rows: list[db_models.Transaction] = []
    for data in items:
        row = db_models.Transaction(
            tenant_id=tenant_id,
            amount=data.amount,
            date=data.date,
            type=data.type,
            category=data.category,
            is_recurring=data.is_recurring,
            last_activity=data.last_activity or data.date,
        )
        db.add(row)
        rows.append(row)
    db.commit()
    for r in rows:
        db.refresh(r)
    return rows


# ---------------------------------------------------------------------------
# Clients
# ---------------------------------------------------------------------------

def list_clients(
    db: Session,
    tenant_id: str,
) -> Sequence[db_models.Client]:
    return (
        db.query(db_models.Client)
        .filter(db_models.Client.tenant_id == tenant_id)
        .order_by(db_models.Client.name)
        .all()
    )


def get_client(
    db: Session,
    tenant_id: str,
    client_id: str,
) -> db_models.Client | None:
    return (
        db.query(db_models.Client)
        .filter(
            db_models.Client.id == client_id,
            db_models.Client.tenant_id == tenant_id,
        )
        .first()
    )


def create_client(
    db: Session,
    tenant_id: str,
    data: ClientCreate,
) -> db_models.Client:
    c = db_models.Client(
        tenant_id=tenant_id,
        name=data.name,
        email=data.email,
        total_billed=data.total_billed,
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


def update_client(
    db: Session,
    tenant_id: str,
    client_id: str,
    data: ClientUpdate,
) -> db_models.Client | None:
    c = get_client(db, tenant_id, client_id)
    if c is None:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(c, field, value)
    db.commit()
    db.refresh(c)
    return c


def delete_client(
    db: Session,
    tenant_id: str,
    client_id: str,
) -> bool:
    c = get_client(db, tenant_id, client_id)
    if c is None:
        return False
    db.delete(c)
    db.commit()
    return True


# ---------------------------------------------------------------------------
# Suppliers
# ---------------------------------------------------------------------------

def list_suppliers(
    db: Session,
    tenant_id: str,
) -> Sequence[db_models.Supplier]:
    return (
        db.query(db_models.Supplier)
        .filter(db_models.Supplier.tenant_id == tenant_id)
        .order_by(db_models.Supplier.name)
        .all()
    )


def get_supplier(
    db: Session,
    tenant_id: str,
    supplier_id: str,
) -> db_models.Supplier | None:
    return (
        db.query(db_models.Supplier)
        .filter(
            db_models.Supplier.id == supplier_id,
            db_models.Supplier.tenant_id == tenant_id,
        )
        .first()
    )


def create_supplier(
    db: Session,
    tenant_id: str,
    data: SupplierCreate,
) -> db_models.Supplier:
    s = db_models.Supplier(
        tenant_id=tenant_id,
        name=data.name,
        email=data.email,
        total_billed=data.total_billed,
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    return s


def update_supplier(
    db: Session,
    tenant_id: str,
    supplier_id: str,
    data: SupplierUpdate,
) -> db_models.Supplier | None:
    s = get_supplier(db, tenant_id, supplier_id)
    if s is None:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(s, field, value)
    db.commit()
    db.refresh(s)
    return s


def delete_supplier(
    db: Session,
    tenant_id: str,
    supplier_id: str,
) -> bool:
    s = get_supplier(db, tenant_id, supplier_id)
    if s is None:
        return False
    db.delete(s)
    db.commit()
    return True


# ---------------------------------------------------------------------------
# Stockholders
# ---------------------------------------------------------------------------

def list_stockholders(
    db: Session,
    tenant_id: str,
) -> Sequence[db_models.Stockholder]:
    return (
        db.query(db_models.Stockholder)
        .filter(db_models.Stockholder.tenant_id == tenant_id)
        .order_by(db_models.Stockholder.name)
        .all()
    )


def get_stockholder(
    db: Session,
    tenant_id: str,
    stockholder_id: str,
) -> db_models.Stockholder | None:
    return (
        db.query(db_models.Stockholder)
        .filter(
            db_models.Stockholder.id == stockholder_id,
            db_models.Stockholder.tenant_id == tenant_id,
        )
        .first()
    )


def create_stockholder(
    db: Session,
    tenant_id: str,
    data: StockholderCreate,
) -> db_models.Stockholder:
    s = db_models.Stockholder(
        tenant_id=tenant_id,
        name=data.name,
        email=data.email,
        share_percent=data.share_percent,
        notes=data.notes,
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    return s


def update_stockholder(
    db: Session,
    tenant_id: str,
    stockholder_id: str,
    data: StockholderUpdate,
) -> db_models.Stockholder | None:
    s = get_stockholder(db, tenant_id, stockholder_id)
    if s is None:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(s, field, value)
    db.commit()
    db.refresh(s)
    return s


def delete_stockholder(
    db: Session,
    tenant_id: str,
    stockholder_id: str,
) -> bool:
    s = get_stockholder(db, tenant_id, stockholder_id)
    if s is None:
        return False
    db.delete(s)
    db.commit()
    return True


# ---------------------------------------------------------------------------
# Utilities
# ---------------------------------------------------------------------------

_ENTITY_MAP = {
    "transaction": db_models.Transaction,
    "client": db_models.Client,
    "supplier": db_models.Supplier,
    "stockholder": db_models.Stockholder,
}


def wipe_entity(db: Session, tenant_id: str, entity_type: str) -> int:
    """Delete all rows of an entity type for a tenant. Returns row count."""
    model = _ENTITY_MAP.get(entity_type.lower())
    if model is None:
        raise ValueError(f"Unknown entity type: {entity_type}. Choose from: {list(_ENTITY_MAP)}")
    count = db.query(model).filter(model.tenant_id == tenant_id).delete()
    db.commit()
    return count


def count_all(db: Session, tenant_id: str) -> dict[str, int]:
    """Quick health check: row counts per entity for a tenant."""
    return {
        name: db.query(model).filter(model.tenant_id == tenant_id).count()
        for name, model in _ENTITY_MAP.items()
    }
