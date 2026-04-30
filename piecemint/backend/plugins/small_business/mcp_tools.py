import json

def register_mcp_tools(mcp, session_scope, resolve_tenant_id, db_models):
    @mcp.tool()
    def get_suite_health() -> str:
        """Get health status of the small business suite."""
        return json.dumps({
            "ok": True,
            "suite": "small_business",
            "version": "0.1.0"
        }, indent=2)
