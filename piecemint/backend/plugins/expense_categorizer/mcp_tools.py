import json
from api.tenant_data import get_tenant_data
from plugins.expense_categorizer.logic import smart_categorize as logic_smart_categorize, CategorizeIn
from fastapi import HTTPException

def register_mcp_tools(mcp, session_scope, resolve_tenant_id, db_models):
    @mcp.tool()
    def search_expenses(tenant: str, query: str) -> str:
        """Search expenses by keyword (e.g. 'cloud' or any text) for a tenant."""
        with session_scope() as db:
            tid = resolve_tenant_id(db, tenant)
            if not tid:
                return json.dumps({"ok": False, "error": f"Unknown tenant: {tenant!r}"})
            
            data = get_tenant_data(db, tid)
            transactions = data.get("transactions", [])
            
        q = query.lower()
        cloud_keywords = ["aws", "azure", "vercel", "cloud", "hosting"]
        
        results = []
        for t in transactions:
            if t.get("type") == "expense" and t.get("category"):
                if "cloud" in q:
                    if any(kw in str(t["category"]).lower() for kw in cloud_keywords):
                        results.append(t)
                elif q in str(t["category"]).lower():
                    results.append(t)
                    
        return json.dumps({"ok": True, "results": results}, indent=2)

    @mcp.tool()
    def smart_categorize(tenant: str, items_json: str) -> str:
        """Classify uncategorized items using Google GenAI. items_json must have keys: clients, suppliers, transactions, stockholders containing lists of dicts."""
        # Tenant is checked for validity
        with session_scope() as db:
            tid = resolve_tenant_id(db, tenant)
            if not tid:
                return json.dumps({"ok": False, "error": f"Unknown tenant: {tenant!r}"})
                
        try:
            payload = json.loads(items_json)
        except json.JSONDecodeError:
            return json.dumps({"ok": False, "error": "Invalid items_json: Must be valid JSON."})
            
        try:
            body = CategorizeIn(**payload)
        except Exception as e:
            return json.dumps({"ok": False, "error": f"Invalid items_json format: {e}"})
            
        try:
            result = logic_smart_categorize(body)
            return json.dumps({"ok": True, "categories": result}, indent=2)
        except HTTPException as e:
            return json.dumps({"ok": False, "error": e.detail})
        except Exception as e:
            return json.dumps({"ok": False, "error": str(e)})
