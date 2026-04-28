import sys
from pathlib import Path

_plug = str(Path(__file__).resolve().parent)
if _plug not in sys.path:
    sys.path.insert(0, _plug)

from fastapi import APIRouter, Body, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

from api import db_models
from api.deps import DbSession, TenantId

from builders import render_invoice
from schemas import InvoiceExportConfig

router = APIRouter()


def _get_client(db: Session, client_id: str, tenant_id: str) -> db_models.Client | None:
    return (
        db.query(db_models.Client)
        .filter(
            db_models.Client.id == client_id,
            db_models.Client.tenant_id == tenant_id,
        )
        .first()
    )


def _invoice_response(c: db_models.Client, cfg: InvoiceExportConfig) -> Response:
    content, media_type, ext = render_invoice(
        c.name,
        c.email,
        c.id,
        float(c.total_billed),
        cfg,
    )
    safe_id = "".join(ch for ch in c.id if ch.isalnum() or ch in "-_")[:40] or "client"
    filename = f"invoice_{safe_id}{ext}"
    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/invoice_gen/generate/{client_id}")
def generate_invoice_get(client_id: str, db: DbSession, tenant_id: TenantId):
    """Legacy GET: PDF with default styling (same as empty config)."""
    c = _get_client(db, client_id, tenant_id)
    if not c:
        raise HTTPException(status_code=404, detail="Client not found")
    return _invoice_response(c, InvoiceExportConfig())


@router.post("/invoice_gen/generate/{client_id}")
def generate_invoice_post(
    client_id: str,
    db: DbSession,
    tenant_id: TenantId,
    config: InvoiceExportConfig = Body(...),
):
    c = _get_client(db, client_id, tenant_id)
    if not c:
        raise HTTPException(status_code=404, detail="Client not found")
    return _invoice_response(c, config)
