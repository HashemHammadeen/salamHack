import json
from api.tenant_data import get_tenant_data

def register_mcp_tools(mcp, session_scope, resolve_tenant_id, db_models):
    @mcp.tool()
    def estimate_tax(tenant: str, tax_rate: float = 0.20) -> str:
        """Estimate tax reserve based on total income for a tenant."""
        with session_scope() as db:
            tid = resolve_tenant_id(db, tenant)
            if not tid:
                return json.dumps({"ok": False, "error": f"Unknown tenant: {tenant!r}"})
            
            data = get_tenant_data(db, tid)
            total_income = sum(t["amount"] for t in data.get("transactions", []) if t.get("type") == "income")
            tax_reserve = total_income * tax_rate
            
            return json.dumps({
                "ok": True,
                "total_income": total_income,
                "tax_rate": tax_rate,
                "tax_reserve": tax_reserve
            }, indent=2)
