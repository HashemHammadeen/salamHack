from typing import List

from fastapi import APIRouter, HTTPException

from api import db_models
from api.deps import DbSession, TenantId
from api.models import (
    Client,
    ClientCreate,
    Stockholder,
    StockholderCreate,
    Supplier,
    SupplierCreate,
    TenantInfo,
    Transaction,
    TransactionCreate,
)

router = APIRouter(prefix="/api/core")


def _client_out(c: db_models.Client) -> Client:
    return Client(
        id=c.id,
        name=c.name,
        email=c.email,
        total_billed=c.total_billed,
    )


def _supplier_out(s: db_models.Supplier) -> Supplier:
    return Supplier(
        id=s.id,
        name=s.name,
        email=s.email,
        total_billed=s.total_billed,
    )


def _tx_out(t: db_models.Transaction) -> Transaction:
    return Transaction(
        id=t.id,
        amount=t.amount,
        date=t.date,
        type=t.type,
        category=t.category,
        is_recurring=t.is_recurring,
        last_activity=t.last_activity,
    )


def _sh_out(s: db_models.Stockholder) -> Stockholder:
    pct = float(s.share_percent) if s.share_percent is not None else None
    return Stockholder(
        id=s.id,
        name=s.name,
        email=s.email,
        share_percent=pct,
        notes=s.notes or "",
    )


@router.get("/tenants", response_model=List[TenantInfo])
def list_tenants(db: DbSession) -> List[TenantInfo]:
    """Public catalog of tenants (for demos / MCP discovery). Not tenant-scoped."""
    rows = db.query(db_models.Tenant).order_by(db_models.Tenant.id).all()
    return [TenantInfo(id=t.id, name=t.name) for t in rows]


# --- CRM: clients (tenant_id on every row, scoped by header) ---


@router.get("/clients", response_model=List[Client])
def get_clients(db: DbSession, tenant_id: TenantId) -> List[Client]:
    rows = (
        db.query(db_models.Client)
        .filter(db_models.Client.tenant_id == tenant_id)
        .order_by(db_models.Client.name)
        .all()
    )
    return [_client_out(c) for c in rows]


@router.post("/clients", response_model=Client)
def create_client(db: DbSession, tenant_id: TenantId, body: ClientCreate) -> Client:
    c = db_models.Client(
        tenant_id=tenant_id,
        name=body.name,
        email=body.email,
        total_billed=body.total_billed,
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return _client_out(c)


@router.delete("/clients/{client_id}", status_code=204)
def delete_client(db: DbSession, tenant_id: TenantId, client_id: str) -> None:
    c = (
        db.query(db_models.Client)
        .filter(db_models.Client.id == client_id, db_models.Client.tenant_id == tenant_id)
        .first()
    )
    if not c:
        raise HTTPException(404, "Client not found for this tenant")
    db.delete(c)
    db.commit()


# --- Suppliers ---


@router.get("/suppliers", response_model=List[Supplier])
def get_suppliers(db: DbSession, tenant_id: TenantId) -> List[Supplier]:
    rows = (
        db.query(db_models.Supplier)
        .filter(db_models.Supplier.tenant_id == tenant_id)
        .order_by(db_models.Supplier.name)
        .all()
    )
    return [_supplier_out(s) for s in rows]


@router.post("/suppliers", response_model=Supplier)
def create_supplier(db: DbSession, tenant_id: TenantId, body: SupplierCreate) -> Supplier:
    s = db_models.Supplier(
        tenant_id=tenant_id,
        name=body.name,
        email=body.email,
        total_billed=body.total_billed,
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    return _supplier_out(s)


# --- Transactions ---


@router.get("/transactions", response_model=List[Transaction])
def get_transactions(db: DbSession, tenant_id: TenantId) -> List[Transaction]:
    rows = (
        db.query(db_models.Transaction)
        .filter(db_models.Transaction.tenant_id == tenant_id)
        .order_by(db_models.Transaction.date)
        .all()
    )
    return [_tx_out(t) for t in rows]


@router.post("/transactions", response_model=Transaction)
def create_transaction(
    db: DbSession, tenant_id: TenantId, body: TransactionCreate
) -> Transaction:
    last = body.last_activity or body.date
    t = db_models.Transaction(
        tenant_id=tenant_id,
        amount=body.amount,
        date=body.date,
        type=body.type,
        category=body.category,
        is_recurring=body.is_recurring,
        last_activity=last,
    )
    db.add(t)
    db.commit()
    db.refresh(t)
    return _tx_out(t)


# --- Stockholders (tenant_id on every row) ---


@router.get("/stockholders", response_model=List[Stockholder])
def get_stockholders(db: DbSession, tenant_id: TenantId) -> List[Stockholder]:
    rows = (
        db.query(db_models.Stockholder)
        .filter(db_models.Stockholder.tenant_id == tenant_id)
        .order_by(db_models.Stockholder.name)
        .all()
    )
    return [_sh_out(s) for s in rows]


@router.post("/stockholders", response_model=Stockholder)
def create_stockholder(
    db: DbSession, tenant_id: TenantId, body: StockholderCreate
) -> Stockholder:
    s = db_models.Stockholder(
        tenant_id=tenant_id,
        name=body.name,
        email=body.email,
        share_percent=body.share_percent,
        notes=body.notes,
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    return _sh_out(s)


@router.delete("/stockholders/{stockholder_id}", status_code=204)
def delete_stockholder(
    db: DbSession, tenant_id: TenantId, stockholder_id: str
) -> None:
    s = (
        db.query(db_models.Stockholder)
        .filter(
            db_models.Stockholder.id == stockholder_id,
            db_models.Stockholder.tenant_id == tenant_id,
        )
        .first()
    )
    if not s:
        raise HTTPException(404, "Stockholder not found for this tenant")
    db.delete(s)
    db.commit()
