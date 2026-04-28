from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from pydantic import BaseModel

app = FastAPI(title="MarketPlace API")

# Allow CORS for local frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

class Plugin(BaseModel):
    id: str
    name: str
    description: str
    price: str
    is_free: bool

PLUGINS: List[Plugin] = [
    Plugin(
        id="mcp",
        name="MCP Protocol",
        description="Connect FinanceFlow directly to Claude for AI-powered data management.",
        price="Free",
        is_free=True
    ),
    Plugin(
        id="invoice_gen",
        name="Invoice Generator",
        description="Create, customize, and export professional invoices instantly.",
        price="Free",
        is_free=True
    ),
    Plugin(
        id="expense_categorizer",
        name="Expense Categorizer",
        description="Automatically categorize and organize your transactions.",
        price="$4.99/mo",
        is_free=False
    ),
    Plugin(
        id="tax_calculator",
        name="Tax Calculator",
        description="Estimate your tax liabilities across multiple jurisdictions.",
        price="$9.99/mo",
        is_free=False
    ),
    Plugin(
        id="small_business",
        name="Small Business Suite",
        description="Comprehensive tools tailored for small business accounting.",
        price="$14.99/mo",
        is_free=False
    ),
    Plugin(
        id="stockholders",
        name="Stockholders Management",
        description="Manage equity, dividends, and stockholder communications.",
        price="$19.99/mo",
        is_free=False
    ),
    Plugin(
        id="ai_prediction",
        name="AI Prediction",
        description="Advanced forecasting for cash flow and revenue models.",
        price="$29.99/mo",
        is_free=False
    ),
    Plugin(
        id="email_notifications",
        name="Email Notifications",
        description="Automated alerts and reports delivered straight to your inbox.",
        price="$1.99/mo",
        is_free=False
    ),
    Plugin(
        id="web_notifications",
        name="Web Notifications",
        description="Real-time push notifications for important financial events.",
        price="$1.99/mo",
        is_free=False
    )
]

@app.get("/api/plugins", response_model=List[Plugin])
def get_plugins():
    return PLUGINS
