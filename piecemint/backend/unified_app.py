"""
Piecemint Unified Server — single process serving:
  - Piecemint web app (React SPA at /)
  - Marketplace web app (React SPA at /market/)
  - Piecemint REST API (/api/*)
  - Marketplace REST API (/market/api/*)
  - MCP server (/mcp)
  - MCP status endpoint (/api/mcp/status)

Run:  uvicorn unified_app:app --host 0.0.0.0 --port $PORT
"""

from __future__ import annotations

import json
import mimetypes
import os
import sys
import importlib.util
from contextlib import contextmanager
from pathlib import Path

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles

# ---------------------------------------------------------------------------
# Path setup — repo root is two levels up from this file
# ---------------------------------------------------------------------------
_BACKEND_ROOT = Path(__file__).resolve().parent
_REPO_ROOT = _BACKEND_ROOT.parent.parent  # repo root

sys.path.insert(0, str(_BACKEND_ROOT))

# ---------------------------------------------------------------------------
# Database init
# ---------------------------------------------------------------------------
from api.database import SessionLocal, init_db
from api import db_models
from api.seed import ensure_seed_data

init_db()
_db0 = SessionLocal()
try:
    ensure_seed_data(_db0)
finally:
    _db0.close()

# ---------------------------------------------------------------------------
# Piecemint API (core + dev + plugins)
# ---------------------------------------------------------------------------
from api.core_routes import router as core_router
from api.dev_routes import router as dev_router
from plugin_manager import PluginManager

plugin_manager = PluginManager()
plugin_manager.discover_plugins()

# ---------------------------------------------------------------------------
# Marketplace API helpers (re-implemented inline so sys.path works in container)
# ---------------------------------------------------------------------------
import io
import zipfile
import yaml
from typing import Any, List
from pydantic import BaseModel
from plugin_icon import resolve_plugin_icon_path


class Plugin(BaseModel):
    id: str
    name: str
    description: str
    price: str
    is_free: bool
    has_icon: bool


PIECEMINT_BACKEND = _BACKEND_ROOT


def _should_skip_zip_path(path: Path) -> bool:
    parts = set(path.parts)
    if "__pycache__" in parts:
        return True
    if path.name.startswith(".") and path.name not in (".gitignore",):
        return True
    return path.suffix.lower() in (".pyc", ".pyo")


def _plugin_source_dir(plugin_id: str) -> Path | None:
    for sub in ("plugins", "disabled_plugins"):
        d = PIECEMINT_BACKEND / sub / plugin_id
        if d.is_dir() and (d / "logic.py").exists() and (d / "manifest.yaml").exists():
            return d
    return None


def _manifest_marketplace(meta: dict[str, Any] | None) -> tuple[str, bool]:
    if not meta:
        return "Free", True
    block = meta.get("marketplace")
    if not isinstance(block, dict):
        return "Free", True
    price = str(block.get("price") or "Free").strip() or "Free"
    is_free = bool(block.get("is_free", True))
    return price, is_free


def discover_piecemint_plugins() -> List[Plugin]:
    found: dict[str, Plugin] = {}
    for sub in ("plugins", "disabled_plugins"):
        root = PIECEMINT_BACKEND / sub
        if not root.is_dir():
            continue
        for child in sorted(root.iterdir()):
            if not child.is_dir():
                continue
            pid = child.name
            if pid in found:
                continue
            manifest_path = child / "manifest.yaml"
            logic_path = child / "logic.py"
            if not manifest_path.is_file() or not logic_path.is_file():
                continue
            with open(manifest_path, encoding="utf-8") as f:
                raw = yaml.safe_load(f) or {}
            name = str(raw.get("name") or pid).strip() or pid
            description = str(raw.get("description") or "").strip() or name
            price, is_free = _manifest_marketplace(raw if isinstance(raw, dict) else None)
            meta = raw if isinstance(raw, dict) else None
            icon_abs = resolve_plugin_icon_path(str(child), meta)
            found[pid] = Plugin(
                id=pid,
                name=name,
                description=description,
                price=price,
                is_free=is_free,
                has_icon=icon_abs is not None,
            )
    return sorted(found.values(), key=lambda p: p.name.lower())


MARKETPLACE_PLUGINS: List[Plugin] = discover_piecemint_plugins()


# ---------------------------------------------------------------------------
# MCP Server (FastMCP + stdio tools + dynamic plugin tools)
# ---------------------------------------------------------------------------
from mcp.server.fastmcp import FastMCP
from api.smtp_outbound import SmtpSendError, send_email_with_attachments, send_plain_email, smtp_is_configured
from api.tenant_query import resolve_tenant_id

_INVOICE_GEN = str(_BACKEND_ROOT / "plugins" / "invoice_gen")
if _INVOICE_GEN not in sys.path:
    sys.path.insert(0, _INVOICE_GEN)
from builders import render_invoice
from schemas import InvoiceExportConfig


@contextmanager
def session_scope():
    s = SessionLocal()
    try:
        yield s
        s.commit()
    except Exception:
        s.rollback()
        raise
    finally:
        s.close()


mcp_core = FastMCP(
    "Piecemint",
    instructions="Read and modify Piecemint data (single org).",
)


# --- Built-in MCP tools ---
@mcp_core.tool()
def list_tenants() -> str:
    with session_scope() as db:
        rows = db.query(db_models.Tenant).order_by(db_models.Tenant.id).all()
        data = [{"id": t.id, "name": t.name} for t in rows]
    return json.dumps(data, indent=2)


@mcp_core.tool()
def get_clients(tenant: str) -> str:
    with session_scope() as db:
        tid = resolve_tenant_id(db, tenant)
        if not tid:
            return json.dumps({"error": f"Unknown tenant: {tenant!r}"})
        clients = db.query(db_models.Client).filter(db_models.Client.tenant_id == tid).order_by(db_models.Client.name).all()
        out = [{"id": c.id, "name": c.name, "email": c.email, "total_billed": c.total_billed} for c in clients]
    return json.dumps(out, indent=2)


@mcp_core.tool()
def get_stockholders(tenant: str) -> str:
    with session_scope() as db:
        tid = resolve_tenant_id(db, tenant)
        if not tid:
            return json.dumps({"error": f"Unknown tenant: {tenant!r}"})
        rows = db.query(db_models.Stockholder).filter(db_models.Stockholder.tenant_id == tid).order_by(db_models.Stockholder.name).all()
        out = [{"id": s.id, "name": s.name, "email": s.email, "share_percent": float(s.share_percent) if s.share_percent is not None else None, "notes": s.notes} for s in rows]
    return json.dumps(out, indent=2)


@mcp_core.tool()
def add_stockholder(tenant: str, name: str, email: str = "", share_percent: float | None = None, notes: str = "") -> str:
    with session_scope() as db:
        tid = resolve_tenant_id(db, tenant)
        if not tid:
            return json.dumps({"ok": False, "error": f"Unknown tenant: {tenant!r}"})
        sh = db_models.Stockholder(tenant_id=tid, name=name, email=email, share_percent=share_percent, notes=notes)
        db.add(sh)
        db.flush()
        row = {"id": sh.id, "tenant_id": tid, "name": sh.name, "email": sh.email, "share_percent": float(sh.share_percent) if sh.share_percent is not None else None}
    return json.dumps({"ok": True, "stockholder": row}, indent=2)


@mcp_core.tool()
def list_transactions(tenant: str, limit: int = 50) -> str:
    with session_scope() as db:
        tid = resolve_tenant_id(db, tenant)
        if not tid:
            return json.dumps({"error": f"Unknown tenant: {tenant!r}"})
        rows = db.query(db_models.Transaction).filter(db_models.Transaction.tenant_id == tid).order_by(db_models.Transaction.date.desc()).limit(max(1, min(limit, 200))).all()
        out = [{"id": t.id, "amount": t.amount, "date": t.date, "type": t.type, "category": t.category, "notes": t.notes or "", "is_recurring": t.is_recurring} for t in rows]
    return json.dumps(out, indent=2)


def _split_recipients(to_field: str) -> list[str]:
    return [x.strip() for x in to_field.replace(";", ",").split(",") if x.strip()]


@mcp_core.tool()
def send_email(tenant: str, to: str, subject: str, text_body: str) -> str:
    with session_scope() as db:
        tid = resolve_tenant_id(db, tenant)
        if not tid:
            return json.dumps({"ok": False, "error": f"Unknown tenant: {tenant!r}"})
    addrs = _split_recipients(to)
    if not addrs:
        return json.dumps({"ok": False, "error": "No recipient addresses in `to`."})
    if not smtp_is_configured(tid):
        return json.dumps({"ok": False, "error": "SMTP is not configured."})
    try:
        send_plain_email(tid, addrs, subject, text_body)
    except SmtpSendError as e:
        return json.dumps({"ok": False, "error": str(e)})
    return json.dumps({"ok": True, "to": addrs, "subject": subject.strip() or "(no subject)"}, indent=2)


@mcp_core.tool()
def send_invoice_email(tenant: str, client_id: str, to: str | None = None, subject: str | None = None, text_body: str | None = None, config_json: str | None = None) -> str:
    with session_scope() as db:
        tid = resolve_tenant_id(db, tenant)
        if not tid:
            return json.dumps({"ok": False, "error": f"Unknown tenant: {tenant!r}"})
        c = db.query(db_models.Client).filter(db_models.Client.id == client_id, db_models.Client.tenant_id == tid).first()
        if not c:
            return json.dumps({"ok": False, "error": f"Client not found: {client_id!r}"})
    to_addr = (to or "").strip() or ((c.email or "").strip() if c else "") or None
    if not to_addr:
        return json.dumps({"ok": False, "error": "No recipient: set `to` or add an email on the client record."})
    if config_json and config_json.strip():
        try:
            cfg = InvoiceExportConfig.model_validate_json(config_json.strip())
        except Exception as e:
            return json.dumps({"ok": False, "error": f"Invalid config_json: {e}"})
    else:
        cfg = InvoiceExportConfig()
    if not smtp_is_configured(tid):
        return json.dumps({"ok": False, "error": "SMTP is not configured."})
    content, media_type, ext = render_invoice(c.name, c.email, c.id, float(c.total_billed), cfg)
    doc = cfg.invoice_document
    inv = (doc.invoice_number or "").strip() if doc else ""
    default_subj = f"Invoice {inv}" if inv else f"Invoice — {c.name}"
    subj = (subject or "").strip() or default_subj
    default_body = f"Hello,\n\nPlease find your invoice attached.\n\nThank you,\n{c.name} (via Piecemint)\n"
    body = (text_body or "").strip() or default_body
    safe_id = "".join(ch for ch in c.id if ch.isalnum() or ch in "-_")[:40] or "client"
    filename = f"invoice_{safe_id}{ext}"
    try:
        send_email_with_attachments(tid, [to_addr], subj, body, [(filename, content, media_type)])
    except SmtpSendError as e:
        return json.dumps({"ok": False, "error": str(e)})
    return json.dumps({"ok": True, "to": to_addr, "subject": subj, "filename": filename}, indent=2)


# --- Dynamic plugin MCP tool discovery ---
def load_plugin_mcp_tools():
    plugins_dir = str(_BACKEND_ROOT / "plugins")
    if not os.path.isdir(plugins_dir):
        return
    for entry in os.scandir(plugins_dir):
        if entry.is_dir():
            mcp_tools_path = os.path.join(entry.path, "mcp_tools.py")
            if os.path.isfile(mcp_tools_path):
                spec = importlib.util.spec_from_file_location(f"plugins.{entry.name}.mcp_tools", mcp_tools_path)
                if spec and spec.loader:
                    module = importlib.util.module_from_spec(spec)
                    sys.modules[f"plugins.{entry.name}.mcp_tools"] = module
                    spec.loader.exec_module(module)
                    if hasattr(module, "register_mcp_tools"):
                        module.register_mcp_tools(mcp_core, session_scope, resolve_tenant_id, db_models)


load_plugin_mcp_tools()


# ---------------------------------------------------------------------------
# Assemble the unified FastAPI app
# ---------------------------------------------------------------------------
app = FastAPI(title="Piecemint Unified Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Piecemint API routes ---
app.include_router(core_router)
app.include_router(dev_router)
plugin_manager.register_routes(app)


# --- Marketplace API routes ---
@app.get("/market/api/plugins", response_model=List[Plugin])
def marketplace_get_plugins():
    return MARKETPLACE_PLUGINS


@app.get("/market/api/plugins/{plugin_id}/icon")
def marketplace_plugin_icon(plugin_id: str):
    if "/" in plugin_id or "\\" in plugin_id or plugin_id in (".", ".."):
        raise HTTPException(status_code=404, detail="Unknown plugin id.")
    src = _plugin_source_dir(plugin_id)
    if src is None:
        raise HTTPException(status_code=404, detail="Unknown plugin id.")
    with open(src / "manifest.yaml", encoding="utf-8") as f:
        raw = yaml.safe_load(f) or {}
    meta = raw if isinstance(raw, dict) else None
    path = resolve_plugin_icon_path(str(src), meta)
    if not path:
        raise HTTPException(status_code=404, detail="This plugin has no manifest icon.")
    media_type, _ = mimetypes.guess_type(path)
    return FileResponse(path, media_type=media_type or "application/octet-stream")


@app.get("/market/api/plugins/{plugin_id}/download")
def marketplace_download_plugin(plugin_id: str):
    plugin = next((p for p in MARKETPLACE_PLUGINS if p.id == plugin_id), None)
    if not plugin:
        raise HTTPException(status_code=404, detail="Unknown plugin id.")
    src = _plugin_source_dir(plugin_id)
    if src is None:
        raise HTTPException(status_code=404, detail="Plugin source is missing.")
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for f in sorted(src.rglob("*")):
            if not f.is_file():
                continue
            try:
                rel = f.relative_to(src)
            except ValueError:
                continue
            if _should_skip_zip_path(rel):
                continue
            arc = f"{plugin_id}/{rel.as_posix()}"
            zf.write(f, arc)
    data = buf.getvalue()
    if not data:
        raise HTTPException(status_code=500, detail="Bundle is empty.")
    return Response(
        content=data,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{plugin_id}.ffplugin.zip"'},
    )


# --- Plugin asset endpoint for Piecemint frontend ---
@app.get("/api/plugin-assets/{plugin_id}")
def serve_plugin_icon(plugin_id: str):
    path = plugin_manager.get_plugin_icon_abs_path(plugin_id)
    if not path:
        raise HTTPException(status_code=404, detail="No icon for this plugin.")
    media_type, _ = mimetypes.guess_type(path)
    return FileResponse(path, media_type=media_type or "application/octet-stream")


# --- Plugin list endpoint for Piecemint frontend ---
@app.get("/api/plugins")
def list_plugins():
    return {
        "installed": plugin_manager.get_installed_plugins(),
        "available": plugin_manager.get_available_plugins(),
    }


# --- MCP auth middleware ---
@app.middleware("http")
async def mcp_auth(request: Request, call_next):
    if request.url.path.startswith("/mcp"):
        api_key = os.environ.get("MCP_API_KEY", "")
        if api_key:
            auth_header = request.headers.get("Authorization", "")
            query_key = request.query_params.get("api_key", "")
            provided_key = None
            if auth_header.startswith("Bearer "):
                provided_key = auth_header.split(" ")[1]
            elif query_key:
                provided_key = query_key
            if provided_key != api_key:
                return JSONResponse(status_code=401, content={"error": "Unauthorized"})
    return await call_next(request)


# --- MCP server mount (SSE transport for Claude Desktop compatibility) ---
app.mount("/mcp", mcp_core.sse_app())


# --- MCP status endpoint ---
@app.get("/api/mcp/status")
async def mcp_status(request: Request):
    api_key = os.environ.get("MCP_API_KEY", "")
    proto = request.headers.get("X-Forwarded-Proto", request.url.scheme)
    host = request.headers.get("X-Forwarded-Host", request.url.netloc)
    base_url = f"{proto}://{host}"
    url = f"{base_url}/mcp"
    # SSE transport: Claude connects to the SSE endpoint
    query_auth = f"?api_key={api_key}" if api_key else ""
    claude_url = f"{base_url}/mcp{query_auth}"
    tool_list = []
    try:
        tools = await mcp_core.list_tools()
        for t in tools:
            tool_list.append({"name": t.name, "description": getattr(t, "description", "")})
    except Exception:
        tool_list = [{"name": "tools_loaded", "description": "Tools active but could not be enumerated."}]
    return {
        "running": True,
        "url": url,
        "auth_type": "api_key",
        "api_key": api_key,
        "claude_url": claude_url,
        "transport": "sse",
        "tools": tool_list,
    }


# --- Static file serving (built frontends) ---
_piecemint_dist = _BACKEND_ROOT / "dist" / "piecemint-frontend"
_marketplace_dist = _BACKEND_ROOT / "dist" / "marketplace-frontend"

if _piecemint_dist.is_dir() and _marketplace_dist.is_dir():

    @app.get("/{path:path}")
    async def spa_fallback(path: str):
        # Let API and MCP routes through
        if path.startswith("api/") or path.startswith("mcp"):
            raise HTTPException(status_code=404, detail="Not found")

        # Marketplace SPA — base is '/market/'
        if path == "market" or path.startswith("market/"):
            rel = path[len("market/"):]
            if rel:
                market_file = _marketplace_dist / rel
                if market_file.is_file():
                    return FileResponse(str(market_file))
            idx = _marketplace_dist / "index.html"
            if idx.exists():
                return FileResponse(str(idx))
            raise HTTPException(status_code=404)

        # Piecemint SPA
        # First try serving actual static files (assets, icons, etc.)
        piecemint_file = _piecemint_dist / path
        if piecemint_file.is_file():
            return FileResponse(str(piecemint_file))

        # Fall back to index.html for SPA routing
        idx = _piecemint_dist / "index.html"
        if idx.exists():
            return FileResponse(str(idx))
        raise HTTPException(status_code=404)

elif _piecemint_dist.is_dir():

    @app.get("/{path:path}")
    async def spa_fallback(path: str):
        if path.startswith("api/") or path.startswith("mcp"):
            raise HTTPException(status_code=404, detail="Not found")
        piecemint_file = _piecemint_dist / path
        if piecemint_file.is_file():
            return FileResponse(str(piecemint_file))
        idx = _piecemint_dist / "index.html"
        if idx.exists():
            return FileResponse(str(idx))
        raise HTTPException(status_code=404)

else:
    @app.get("/")
    def piecemint_fallback():
        return {"message": "Piecemint API running. Build the frontend for the UI."}

# ---------------------------------------------------------------------------
# Startup message
# ---------------------------------------------------------------------------
@app.on_event("startup")
def print_startup():
    port = os.environ.get("PORT", "10000")
    print("=" * 60)
    print("Piecemint Unified Server started")
    print("=" * 60)
    print(f"  Piecemint app:    http://0.0.0.0:{port}/")
    print(f"  Marketplace:      http://0.0.0.0:{port}/market/")
    print(f"  API:              http://0.0.0.0:{port}/api/")
    print(f"  MCP endpoint:     http://0.0.0.0:{port}/mcp")
    print(f"  MCP status:       http://0.0.0.0:{port}/api/mcp/status")
    api_key = os.environ.get("MCP_API_KEY", "")
    if api_key:
        print(f"  Claude URL:       http://0.0.0.0:{port}/mcp?api_key=****")
    print("=" * 60)
