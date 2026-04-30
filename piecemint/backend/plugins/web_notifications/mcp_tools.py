import os
import json

def register_mcp_tools(mcp, session_scope, resolve_tenant_id, db_models):
    @mcp.tool()
    def get_notification_status(tenant: str) -> str:
        """Check web notification status and VAPID settings."""
        with session_scope() as db:
            tid = resolve_tenant_id(db, tenant)
            if not tid:
                return json.dumps({"ok": False, "error": f"Unknown tenant: {tenant!r}"})
                
        vapid = os.environ.get("FF_VAPID_PUBLIC_KEY", "").strip() or None
        
        return json.dumps({
            "ok": True,
            "tenant_id": tid,
            "browser_driven": True,
            "vapid_public_key": vapid,
            "note": "Enable notifications in the plugin panel; optional FF_VAPID_* env vars for future Web Push."
        }, indent=2)
