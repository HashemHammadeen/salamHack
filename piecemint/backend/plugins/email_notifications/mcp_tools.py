import json
from api.smtp_outbound import smtp_is_configured, send_plain_email, SmtpSendError

def register_mcp_tools(mcp, session_scope, resolve_tenant_id, db_models):
    @mcp.tool()
    def get_smtp_status(tenant: str) -> str:
        """Check if SMTP is configured for the tenant."""
        with session_scope() as db:
            tid = resolve_tenant_id(db, tenant)
            if not tid:
                return json.dumps({"ok": False, "error": f"Unknown tenant: {tenant!r}"})
        
        configured = smtp_is_configured(tid)
        return json.dumps({"ok": True, "configured": configured}, indent=2)

    @mcp.tool()
    def test_smtp(tenant: str, to: str, subject: str, text: str) -> str:
        """Send a test email using the tenant's SMTP settings."""
        with session_scope() as db:
            tid = resolve_tenant_id(db, tenant)
            if not tid:
                return json.dumps({"ok": False, "error": f"Unknown tenant: {tenant!r}"})
        
        if not smtp_is_configured(tid):
            return json.dumps({"ok": False, "error": "SMTP is not configured."})
            
        addrs = [x.strip() for x in to.replace(";", ",").split(",") if x.strip()]
        if not addrs:
            return json.dumps({"ok": False, "error": "No recipient addresses."})
            
        try:
            send_plain_email(tid, addrs, subject, text)
        except SmtpSendError as e:
            return json.dumps({"ok": False, "error": str(e)})
            
        return json.dumps({"ok": True, "to": addrs, "subject": subject}, indent=2)
