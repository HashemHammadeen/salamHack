"""Shared read model for in-process plugins: dict shape matches the old mock `DB` layout."""

from sqlalchemy.orm import Session

from api import db_models


def ensure_tenant_row(db: Session, tenant_id: str) -> db_models.Tenant:
    t = db.get(db_models.Tenant, tenant_id)
    if t is None:
        t = db_models.Tenant(id=tenant_id, name=tenant_id)
        db.add(t)
        db.commit()
        db.refresh(t)
    return t


def get_tenant_data(db: Session, tenant_id: str) -> dict:
    """Return tenant-scoped collections as plain dicts (plugin compatibility)."""
    ensure_tenant_row(db, tenant_id)
    clients = (
        db.query(db_models.Client)
        .filter(db_models.Client.tenant_id == tenant_id)
        .order_by(db_models.Client.name)
        .all()
    )
    suppliers = (
        db.query(db_models.Supplier)
        .filter(db_models.Supplier.tenant_id == tenant_id)
        .order_by(db_models.Supplier.name)
        .all()
    )
    transactions = (
        db.query(db_models.Transaction)
        .filter(db_models.Transaction.tenant_id == tenant_id)
        .order_by(db_models.Transaction.date)
        .all()
    )
    return {
        "clients": [
            {
                "id": c.id,
                "name": c.name,
                "email": c.email,
                "total_billed": c.total_billed,
            }
            for c in clients
        ],
        "suppliers": [
            {
                "id": s.id,
                "name": s.name,
                "email": s.email,
                "total_billed": s.total_billed,
            }
            for s in suppliers
        ],
        "transactions": [
            {
                "id": t.id,
                "amount": t.amount,
                "date": t.date,
                "type": t.type,
                "category": t.category,
                "is_recurring": t.is_recurring,
                "last_activity": t.last_activity,
            }
            for t in transactions
        ],
    }
