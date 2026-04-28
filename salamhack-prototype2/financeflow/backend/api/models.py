from pydantic import BaseModel, Field


class Client(BaseModel):
    id: str
    name: str
    email: str
    total_billed: float


class ClientCreate(BaseModel):
    name: str
    email: str = ""
    total_billed: float = 0.0


class ClientUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    total_billed: float | None = None


class Supplier(BaseModel):
    id: str
    name: str
    email: str
    total_billed: float


class SupplierCreate(BaseModel):
    name: str
    email: str = ""
    total_billed: float = 0.0


class SupplierUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    total_billed: float | None = None


class Transaction(BaseModel):
    id: str
    amount: float
    date: str
    type: str  # income | expense
    category: str
    is_recurring: bool
    last_activity: str


class TransactionCreate(BaseModel):
    amount: float
    date: str
    type: str
    category: str = ""
    is_recurring: bool = False
    last_activity: str | None = None


class TransactionUpdate(BaseModel):
    amount: float | None = None
    date: str | None = None
    type: str | None = None
    category: str | None = None
    is_recurring: bool | None = None


class Stockholder(BaseModel):
    id: str
    name: str
    email: str = ""
    share_percent: float | None = None
    notes: str = ""


class StockholderCreate(BaseModel):
    name: str
    email: str = ""
    share_percent: float | None = None
    notes: str = ""


class StockholderUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    share_percent: float | None = None
    notes: str | None = None


class TenantInfo(BaseModel):
    id: str
    name: str
