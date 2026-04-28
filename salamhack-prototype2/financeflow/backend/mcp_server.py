"""
Piecemint MCP server — stdio transport, shares the same SQLite DB as FastAPI.

Run (from repo / Cursor MCP config):
  cd piecemint/backend && source venv/bin/activate && python mcp_server.py

Tools scope to the single built-in org; the `tenant` argument accepts id, legacy ids
(tenant_a, tenant_b), or the org display name.
"""

from __future__ import annotations

import json
import os
import sys
from contextlib import contextmanager

# Ensure `api` package is importable when run as a script
_BACKEND_ROOT = os.path.dirname(os.path.abspath(__file__))
if _BACKEND_ROOT not in sys.path:
    sys.path.insert(0, _BACKEND_ROOT)

import argparse

from mcp.server.fastmcp import FastMCP
from sqlalchemy.orm import Session

from api import db_models
from api.database import SessionLocal, init_db
from api.seed import ensure_seed_data
from api.tenant_query import resolve_tenant_id

# Parse CLI flags early so we can set host/port on the FastMCP constructor
_parser = argparse.ArgumentParser(description="Piecemint MCP server")
_parser.add_argument("--sse", action="store_true", help="Run with SSE transport (legacy)")
_parser.add_argument("--remote", action="store_true", help="Run with streamable-http transport (for Claude.ai cloud)")
_parser.add_argument("--port", type=int, default=8001, help="Port for remote modes (default: 8001)")
_args = _parser.parse_args()

_is_remote = _args.sse or _args.remote

# Initialize schema + seed (idempotent) before first tool use
init_db()
_db0 = SessionLocal()
try:
    ensure_seed_data(_db0)
finally:
    _db0.close()

mcp = FastMCP(
    "Piecemint",
    instructions="Read and modify Piecemint data (single org). list_tenants returns the org id and name. Tool `tenant` args accept id, legacy names, or org display name.",
    host="0.0.0.0" if _is_remote else "127.0.0.1",
    port=_args.port,
    # For streamable-http: serve at root so Claude.ai finds it at /
    streamable_http_path="/mcp",
    stateless_http=True,
)


@contextmanager
def session_scope() -> Session:
    s = SessionLocal()
    try:
        yield s
        s.commit()
    except Exception:
        s.rollback()
        raise
    finally:
        s.close()


@mcp.tool()
def list_tenants() -> str:
    """List all tenant ids and display names in the database."""
    with session_scope() as db:
        rows = db.query(db_models.Tenant).order_by(db_models.Tenant.id).all()
    data = [{"id": t.id, "name": t.name} for t in rows]
    return json.dumps(data, indent=2)


@mcp.tool()
def get_clients(tenant: str) -> str:
    """List clients. `tenant` may be org id, legacy id (tenant_a / tenant_b), or display name."""
    with session_scope() as db:
        tid = resolve_tenant_id(db, tenant)
        if not tid:
            return json.dumps({"error": f"Unknown tenant: {tenant!r}"})
        clients = (
            db.query(db_models.Client)
            .filter(db_models.Client.tenant_id == tid)
            .order_by(db_models.Client.name)
            .all()
        )
        out = [
            {
                "id": c.id,
                "name": c.name,
                "email": c.email,
                "total_billed": c.total_billed,
            }
            for c in clients
        ]
    return json.dumps(out, indent=2)


@mcp.tool()
def get_stockholders(tenant: str) -> str:
    """List stockholders for a tenant (by id or name)."""
    with session_scope() as db:
        tid = resolve_tenant_id(db, tenant)
        if not tid:
            return json.dumps({"error": f"Unknown tenant: {tenant!r}"})
        rows = (
            db.query(db_models.Stockholder)
            .filter(db_models.Stockholder.tenant_id == tid)
            .order_by(db_models.Stockholder.name)
            .all()
        )
        out = [
            {
                "id": s.id,
                "name": s.name,
                "email": s.email,
                "share_percent": float(s.share_percent) if s.share_percent is not None else None,
                "notes": s.notes,
            }
            for s in rows
        ]
    return json.dumps(out, indent=2)


@mcp.tool()
def add_stockholder(
    tenant: str,
    name: str,
    email: str = "",
    share_percent: float | None = None,
    notes: str = "",
) -> str:
    """
    Add a stockholder to a tenant. Example: add_stockholder(
        tenant='Acme Corp', name='Alex Founder', email='alex@example.com', share_percent=5.0
    )
    """
    with session_scope() as db:
        tid = resolve_tenant_id(db, tenant)
        if not tid:
            return json.dumps({"ok": False, "error": f"Unknown tenant: {tenant!r}"})
        sh = db_models.Stockholder(
            tenant_id=tid,
            name=name,
            email=email,
            share_percent=share_percent,
            notes=notes,
        )
        db.add(sh)
        db.flush()
        row = {
            "id": sh.id,
            "tenant_id": tid,
            "name": sh.name,
            "email": sh.email,
            "share_percent": float(sh.share_percent) if sh.share_percent is not None else None,
        }
    return json.dumps({"ok": True, "stockholder": row}, indent=2)


@mcp.tool()
def list_transactions(tenant: str, limit: int = 50) -> str:
    """Recent transactions for a tenant (by id or name)."""
    with session_scope() as db:
        tid = resolve_tenant_id(db, tenant)
        if not tid:
            return json.dumps({"error": f"Unknown tenant: {tenant!r}"})
        rows = (
            db.query(db_models.Transaction)
            .filter(db_models.Transaction.tenant_id == tid)
            .order_by(db_models.Transaction.date.desc())
            .limit(max(1, min(limit, 200)))
            .all()
        )
        out = [
            {
                "id": t.id,
                "amount": t.amount,
                "date": t.date,
                "type": t.type,
                "category": t.category,
                "is_recurring": t.is_recurring,
            }
            for t in rows
        ]
    return json.dumps(out, indent=2)


if __name__ == "__main__":
    if _args.remote:
        print(f"Starting Piecemint MCP server (streamable-http) on http://0.0.0.0:{_args.port}")
        print(f"Claude.ai connector URL: https://<your-ngrok-url>/mcp")
        mcp.run(transport="streamable-http")
    elif _args.sse:
        print(f"Starting Piecemint MCP server (SSE) on http://0.0.0.0:{_args.port}")
        print(f"SSE endpoint: https://<your-ngrok-url>/sse")
        mcp.run(transport="sse")
    else:
        mcp.run()  # stdio -- for MCP Inspector and Claude Desktop
