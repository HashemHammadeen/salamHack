from typing import List

from fastapi import APIRouter, HTTPException

from api import crud, db_models
from api.deps import DbSession, TenantId
from api.models import (
    Client,
    ClientCreate,
    ClientUpdate,
    Stockholder,
    StockholderCreate,
    StockholderUpdate,
    Supplier,
    SupplierCreate,
    SupplierUpdate,
    TenantInfo,
    Transaction,
    TransactionCreate,
    TransactionUpdate,
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
    """Catalog of orgs in the DB (single org in default install). Not header-scoped."""
    rows = db.query(db_models.Tenant).order_by(db_models.Tenant.id).all()
    return [TenantInfo(id=t.id, name=t.name) for t in rows]


# --- CRM: clients (rows carry tenant_id; API injects the single default org) ---


@router.get("/clients", response_model=List[Client])
def get_clients(db: DbSession, tenant_id: TenantId) -> List[Client]:
    rows = crud.list_clients(db, tenant_id)
    return [_client_out(c) for c in rows]


@router.get("/clients/{client_id}", response_model=Client)
def get_client(db: DbSession, tenant_id: TenantId, client_id: str) -> Client:
    c = crud.get_client(db, tenant_id, client_id)
    if not c:
        raise HTTPException(404, "Client not found for this tenant")
    return _client_out(c)


@router.post("/clients", response_model=Client)
def create_client(db: DbSession, tenant_id: TenantId, body: ClientCreate) -> Client:
    c = crud.create_client(db, tenant_id, body)
    return _client_out(c)


@router.patch("/clients/{client_id}", response_model=Client)
def update_client(db: DbSession, tenant_id: TenantId, client_id: str, body: ClientUpdate) -> Client:
    c = crud.update_client(db, tenant_id, client_id, body)
    if not c:
        raise HTTPException(404, "Client not found for this tenant")
    return _client_out(c)


@router.delete("/clients/{client_id}", status_code=204)
def delete_client(db: DbSession, tenant_id: TenantId, client_id: str) -> None:
    if not crud.delete_client(db, tenant_id, client_id):
        raise HTTPException(404, "Client not found for this tenant")


# --- Suppliers ---


@router.get("/suppliers", response_model=List[Supplier])
def get_suppliers(db: DbSession, tenant_id: TenantId) -> List[Supplier]:
    rows = crud.list_suppliers(db, tenant_id)
    return [_supplier_out(s) for s in rows]


@router.get("/suppliers/{supplier_id}", response_model=Supplier)
def get_supplier(db: DbSession, tenant_id: TenantId, supplier_id: str) -> Supplier:
    s = crud.get_supplier(db, tenant_id, supplier_id)
    if not s:
        raise HTTPException(404, "Supplier not found for this tenant")
    return _supplier_out(s)


@router.post("/suppliers", response_model=Supplier)
def create_supplier(db: DbSession, tenant_id: TenantId, body: SupplierCreate) -> Supplier:
    s = crud.create_supplier(db, tenant_id, body)
    return _supplier_out(s)


@router.patch("/suppliers/{supplier_id}", response_model=Supplier)
def update_supplier(db: DbSession, tenant_id: TenantId, supplier_id: str, body: SupplierUpdate) -> Supplier:
    s = crud.update_supplier(db, tenant_id, supplier_id, body)
    if not s:
        raise HTTPException(404, "Supplier not found for this tenant")
    return _supplier_out(s)


@router.delete("/suppliers/{supplier_id}", status_code=204)
def delete_supplier(db: DbSession, tenant_id: TenantId, supplier_id: str) -> None:
    if not crud.delete_supplier(db, tenant_id, supplier_id):
        raise HTTPException(404, "Supplier not found for this tenant")


# --- Transactions ---


@router.get("/transactions", response_model=List[Transaction])
def get_transactions(db: DbSession, tenant_id: TenantId) -> List[Transaction]:
    rows = crud.list_transactions(db, tenant_id)
    return [_tx_out(t) for t in rows]


@router.get("/transactions/{tx_id}", response_model=Transaction)
def get_transaction(db: DbSession, tenant_id: TenantId, tx_id: str) -> Transaction:
    t = crud.get_transaction(db, tenant_id, tx_id)
    if not t:
        raise HTTPException(404, "Transaction not found for this tenant")
    return _tx_out(t)


@router.post("/transactions", response_model=Transaction)
def create_transaction(
    db: DbSession, tenant_id: TenantId, body: TransactionCreate
) -> Transaction:
    t = crud.create_transaction(db, tenant_id, body)
    return _tx_out(t)


@router.patch("/transactions/{tx_id}", response_model=Transaction)
def update_transaction(
    db: DbSession, tenant_id: TenantId, tx_id: str, body: TransactionUpdate
) -> Transaction:
    t = crud.update_transaction(db, tenant_id, tx_id, body)
    if not t:
        raise HTTPException(404, "Transaction not found for this tenant")
    return _tx_out(t)


@router.delete("/transactions/{tx_id}", status_code=204)
def delete_transaction(db: DbSession, tenant_id: TenantId, tx_id: str) -> None:
    if not crud.delete_transaction(db, tenant_id, tx_id):
        raise HTTPException(404, "Transaction not found for this tenant")


# --- Stockholders (tenant_id on every row) ---


@router.get("/stockholders", response_model=List[Stockholder])
def get_stockholders(db: DbSession, tenant_id: TenantId) -> List[Stockholder]:
    rows = crud.list_stockholders(db, tenant_id)
    return [_sh_out(s) for s in rows]


@router.get("/stockholders/{stockholder_id}", response_model=Stockholder)
def get_stockholder(db: DbSession, tenant_id: TenantId, stockholder_id: str) -> Stockholder:
    s = crud.get_stockholder(db, tenant_id, stockholder_id)
    if not s:
        raise HTTPException(404, "Stockholder not found for this tenant")
    return _sh_out(s)


@router.post("/stockholders", response_model=Stockholder)
def create_stockholder(
    db: DbSession, tenant_id: TenantId, body: StockholderCreate
) -> Stockholder:
    s = crud.create_stockholder(db, tenant_id, body)
    return _sh_out(s)


@router.patch("/stockholders/{stockholder_id}", response_model=Stockholder)
def update_stockholder(
    db: DbSession, tenant_id: TenantId, stockholder_id: str, body: StockholderUpdate
) -> Stockholder:
    s = crud.update_stockholder(db, tenant_id, stockholder_id, body)
    if not s:
        raise HTTPException(404, "Stockholder not found for this tenant")
    return _sh_out(s)


@router.delete("/stockholders/{stockholder_id}", status_code=204)
def delete_stockholder(
    db: DbSession, tenant_id: TenantId, stockholder_id: str
) -> None:
    if not crud.delete_stockholder(db, tenant_id, stockholder_id):
        raise HTTPException(404, "Stockholder not found for this tenant")
