from fastapi import APIRouter

from api.deps import DbSession, TenantId
from api.tenant_data import get_tenant_data

router = APIRouter()


@router.get("/tax_calculator/estimate")
def estimate_tax(db: DbSession, tenant_id: TenantId, tax_rate: float = 0.20):
    data = get_tenant_data(db, tenant_id)
    total_income = sum(t["amount"] for t in data["transactions"] if t["type"] == "income")
    tax_reserve = total_income * tax_rate
    return {
        "total_income": total_income,
        "tax_rate": tax_rate,
        "tax_reserve": tax_reserve,
    }
