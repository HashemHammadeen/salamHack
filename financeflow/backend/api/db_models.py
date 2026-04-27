import uuid
from sqlalchemy import Boolean, Float, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from api.database import Base


def _id() -> str:
    return str(uuid.uuid4())


class Tenant(Base):
    __tablename__ = "tenants"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)

    clients: Mapped[list["Client"]] = relationship(back_populates="tenant", cascade="all, delete-orphan")
    suppliers: Mapped[list["Supplier"]] = relationship(back_populates="tenant", cascade="all, delete-orphan")
    transactions: Mapped[list["Transaction"]] = relationship(back_populates="tenant", cascade="all, delete-orphan")
    stockholders: Mapped[list["Stockholder"]] = relationship(back_populates="tenant", cascade="all, delete-orphan")


class Client(Base):
    __tablename__ = "clients"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_id)
    tenant_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("tenants.id", ondelete="CASCADE"), index=True, nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), default="")
    total_billed: Mapped[float] = mapped_column(Float, default=0.0)

    tenant: Mapped["Tenant"] = relationship(back_populates="clients")


class Supplier(Base):
    __tablename__ = "suppliers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_id)
    tenant_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("tenants.id", ondelete="CASCADE"), index=True, nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), default="")
    total_billed: Mapped[float] = mapped_column(Float, default=0.0)

    tenant: Mapped["Tenant"] = relationship(back_populates="suppliers")


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_id)
    tenant_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("tenants.id", ondelete="CASCADE"), index=True, nullable=False
    )
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    date: Mapped[str] = mapped_column(String(32), nullable=False)  # ISO YYYY-MM-DD
    type: Mapped[str] = mapped_column(String(32), nullable=False)  # income | expense
    category: Mapped[str] = mapped_column(String(255), default="")
    is_recurring: Mapped[bool] = mapped_column(Boolean, default=False)
    last_activity: Mapped[str] = mapped_column(String(32), nullable=False)

    tenant: Mapped["Tenant"] = relationship(back_populates="transactions")


class Stockholder(Base):
    __tablename__ = "stockholders"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_id)
    tenant_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("tenants.id", ondelete="CASCADE"), index=True, nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), default="")
    share_percent: Mapped[float | None] = mapped_column(Numeric(6, 3), nullable=True)
    notes: Mapped[str] = mapped_column(Text, default="")

    tenant: Mapped["Tenant"] = relationship(back_populates="stockholders")
