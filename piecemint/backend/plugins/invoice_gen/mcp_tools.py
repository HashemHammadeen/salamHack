import json
import base64
from plugins.invoice_gen.builders import render_invoice
from plugins.invoice_gen.schemas import InvoiceExportConfig
from api.smtp_outbound import send_email_with_attachments, SmtpSendError, smtp_is_configured

def register_mcp_tools(mcp, session_scope, resolve_tenant_id, db_models):
    @mcp.tool()
    def generate_invoice(tenant: str, client_id: str, format: str = "pdf") -> str:
        """Generate an invoice file (pdf, xlsx, or docx) for a client and return it as a base64 string."""
        with session_scope() as db:
            tid = resolve_tenant_id(db, tenant)
            if not tid:
                return json.dumps({"ok": False, "error": f"Unknown tenant: {tenant!r}"})
            c = db.query(db_models.Client).filter(
                db_models.Client.id == client_id,
                db_models.Client.tenant_id == tid,
            ).first()
            if not c:
                return json.dumps({"ok": False, "error": f"Client not found: {client_id!r}"})

        cfg = InvoiceExportConfig(output_format=format)
        content, media_type, ext = render_invoice(
            c.name, c.email or "", c.id, float(c.total_billed), cfg
        )
        
        b64 = base64.b64encode(content).decode('ascii')
        return json.dumps({
            "ok": True,
            "filename": f"invoice_{c.id}{ext}",
            "media_type": media_type,
            "content_base64": b64
        }, indent=2)

    @mcp.tool()
    def email_invoice(tenant: str, client_id: str, to: str = "", subject: str = "", body: str = "") -> str:
        """Generate and send an invoice via email to the client."""
        with session_scope() as db:
            tid = resolve_tenant_id(db, tenant)
            if not tid:
                return json.dumps({"ok": False, "error": f"Unknown tenant: {tenant!r}"})
            c = db.query(db_models.Client).filter(
                db_models.Client.id == client_id,
                db_models.Client.tenant_id == tid,
            ).first()
            if not c:
                return json.dumps({"ok": False, "error": f"Client not found: {client_id!r}"})

        to_addr = (to or "").strip() or ((c.email or "").strip() if c else "") or None
        if not to_addr:
            return json.dumps({"ok": False, "error": "No recipient: set `to` or add an email on the client record."})

        if not smtp_is_configured(tid):
            return json.dumps({"ok": False, "error": "SMTP is not configured."})

        cfg = InvoiceExportConfig()
        content, media_type, ext = render_invoice(
            c.name, c.email or "", c.id, float(c.total_billed), cfg
        )
        
        subj = (subject or "").strip() or f"Invoice — {c.name}"
        text_body = (body or "").strip() or f"Hello,\n\nPlease find your invoice attached.\n\nThank you,\n{c.name}"
        filename = f"invoice_{c.id}{ext}"

        try:
            send_email_with_attachments(
                tid,
                [to_addr],
                subj,
                text_body,
                [(filename, content, media_type)],
            )
        except SmtpSendError as e:
            return json.dumps({"ok": False, "error": str(e)})

        return json.dumps({"ok": True, "to": to_addr, "subject": subj, "filename": filename}, indent=2)
