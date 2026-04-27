import json
import os
import re
from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from api.deps import DbSession, TenantId
from api.tenant_data import get_tenant_data

# Load backend/.env so GOOGLE_API_KEY / GEMINI_API_KEY are available in dev
try:
    from dotenv import load_dotenv

    _env_path = Path(__file__).resolve().parents[2] / ".env"
    load_dotenv(_env_path)
except ImportError:
    pass

try:
    from google import genai
    from google.genai import types as genai_types
except ImportError as e:  # pragma: no cover
    genai = None  # type: ignore[misc, assignment]
    genai_types = None  # type: ignore[misc, assignment]
    _GENAI_IMPORT_ERROR = e
else:
    _GENAI_IMPORT_ERROR = None

router = APIRouter()

# Google AI Studio / Gemini API: https://ai.google.dev/gemini-api/docs
# Set GOOGLE_API_KEY or GEMINI_API_KEY in backend/.env (or the environment)
GOOGLE_GENAI_MODEL = os.environ.get("GOOGLE_GENAI_MODEL") or os.environ.get("GEMINI_MODEL", "gemini-2.0-flash")

# Baseline labels (align with frontend `categoryTaxonomy.ts`)
BASE = {
    "clients": [
        "Enterprise",
        "Mid-market (SMB)",
        "Small business",
        "Startup",
        "Government & public sector",
        "Non-profit",
        "Individual & sole proprietor",
        "Education & research",
        "Healthcare & life sciences",
        "Unclassified",
    ],
    "suppliers": [
        "Software & SaaS",
        "Cloud & infrastructure",
        "Professional & legal",
        "Accounting & tax",
        "Payroll & HR",
        "Logistics & shipping",
        "Office & supplies",
        "Marketing & creative",
        "Utilities & telecom",
        "Facilities & rent",
        "Banking & payment fees",
        "Insurance",
        "Travel & events",
        "Hardware & equipment",
        "Other vendor",
    ],
    "transactions": [
        "Payroll & contractors",
        "Software & subscriptions",
        "Cloud & hosting",
        "Travel & lodging",
        "Meals & entertainment",
        "Rent & facilities",
        "Marketing & ads",
        "Professional fees",
        "Taxes & compliance",
        "Insurance",
        "Utilities",
        "Equipment & fixed assets",
        "Transfers & internal",
        "Interest & bank fees",
        "Revenue & sales",
        "Uncategorized",
    ],
    "stockholders": [
        "Founder & executive",
        "Angel & seed investor",
        "Venture & institutional",
        "Employee equity pool",
        "Family & friends",
        "Advisory (non-investor)",
        "Other / unspecified",
    ],
}


def _google_api_key() -> str:
    key = (os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY") or "").strip()
    if not key:
        raise HTTPException(
            503,
            "Missing API key. Set GOOGLE_API_KEY or GEMINI_API_KEY in backend/.env (or the process environment). "
            "Create a key: https://aistudio.google.com/apikey",
        )
    return key


def _genai_classify(user_content: str) -> str:
    if genai is None or genai_types is None:
        raise HTTPException(503, f"google-genai is not installed: {_GENAI_IMPORT_ERROR!r}")
    client = genai.Client(api_key=_google_api_key())
    try:
        response = client.models.generate_content(
            model=GOOGLE_GENAI_MODEL,
            contents=user_content,
            config=genai_types.GenerateContentConfig(
                response_mime_type="application/json",
            ),
        )
    except Exception as e:  # google.genai errors, network, quota, etc.
        raise HTTPException(502, f"Google Generative AI request failed: {e!s}") from e
    text = (response.text or "").strip()
    if not text and getattr(response, "candidates", None):
        # Fallback: some responses only populate candidates
        parts: list[str] = []
        for c in response.candidates or []:
            for p in c.content.parts or [] if c.content else []:
                if hasattr(p, "text") and p.text:
                    parts.append(p.text)
        text = "\n".join(parts).strip()
    if not text:
        raise HTTPException(502, "Google Generative AI returned an empty response.")
    return text


class CategorizeIn(BaseModel):
    """Client sends only rows that are still missing an app category (uncategorized)."""

    clients: list[dict[str, Any]] = Field(default_factory=list)
    suppliers: list[dict[str, Any]] = Field(default_factory=list)
    transactions: list[dict[str, Any]] = Field(default_factory=list)
    stockholders: list[dict[str, Any]] = Field(default_factory=list)


def _parse_json_object(text: str) -> dict[str, Any]:
    text = (text or "").strip()
    if not text:
        raise ValueError("empty model output")
    if text.startswith("```"):
        text = re.sub(r"^```[a-zA-Z0-9]*\s*\n", "", text)
        text = re.sub(r"\n```\s*$", "", text).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        a = text.find("{")
        b = text.rfind("}")
        if a >= 0 and b > a:
            return json.loads(text[a : b + 1])
        raise


def _coerce_id_map(d: Any) -> dict[str, str]:
    if not isinstance(d, dict):
        return {}
    return {str(k): str(v).strip() for k, v in d.items() if str(v).strip()}


@router.get("/expense_categorizer/search")
def search_expenses(query: str, db: DbSession, tenant_id: TenantId):
    data = get_tenant_data(db, tenant_id)
    transactions = data["transactions"]

    query = query.lower()
    cloud_keywords = ["aws", "azure", "vercel", "cloud", "hosting"]

    results = []
    for t in transactions:
        if t["type"] == "expense":
            if "cloud" in query:
                if any(kw in t["category"].lower() for kw in cloud_keywords):
                    results.append(t)
            elif query in t["category"].lower():
                results.append(t)

    return {"results": results}


@router.post("/expense_categorizer/smart_categorize")
def smart_categorize(body: CategorizeIn) -> dict[str, Any]:
    """
    Classify uncategorized records using Google Generative AI (Gemini) via the official genai SDK.
    Expects a JSON object mapping id -> category for each group.
    """
    total = len(body.clients) + len(body.suppliers) + len(body.transactions) + len(body.stockholders)
    if total == 0:
        return {
            "clients": {},
            "suppliers": {},
            "transactions": {},
            "stockholders": {},
        }

    payload = {
        "clients": body.clients,
        "suppliers": body.suppliers,
        "transactions": body.transactions,
        "stockholders": body.stockholders,
    }
    data_json = json.dumps(payload, ensure_ascii=False, indent=2)
    system_lines = [
        "You are a financial data classifier. Output ONLY a single JSON object, no markdown, no code fences.",
        "The data below includes ONLY items that are still UNcategorized in the app — assign a category to each id.",
        "Keys: clients, suppliers, transactions, stockholders — each is an object mapping string id to category string.",
        "You must return an entry for every id in the input (same ids).",
        "Prefer labels from the allowed pools; you may add a new short Title Case label if needed (max ~5 words).",
        "Allowed pools:",
        f"- clients: {json.dumps(BASE['clients'])}",
        f"- suppliers: {json.dumps(BASE['suppliers'])}",
        f"- transactions: {json.dumps(BASE['transactions'])}",
        f"- stockholders: {json.dumps(BASE['stockholders'])}",
        "Input data (JSON) follows.",
    ]
    user_content = "\n".join(system_lines) + "\n\nUNCATEGORIZED_DATA:\n" + data_json
    try:
        content = _genai_classify(user_content)
    except HTTPException:
        raise
    try:
        data = _parse_json_object(content)
    except (json.JSONDecodeError, ValueError) as e:
        raise HTTPException(
            502,
            f"Model did not return valid JSON. Raw (truncated): {content[:1200]!r}",
        ) from e

    return {
        "clients": _coerce_id_map(data.get("clients")),
        "suppliers": _coerce_id_map(data.get("suppliers")),
        "transactions": _coerce_id_map(data.get("transactions")),
        "stockholders": _coerce_id_map(data.get("stockholders")),
    }
