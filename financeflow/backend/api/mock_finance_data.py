"""
Comprehensive mock rows for local/demo DB seeding. Matches db_models (every column).

* Client / Supplier: id, tenant_id, name, email, total_billed
* Transaction: id, tenant_id, amount, date, type, category, is_recurring, last_activity
* Stockholder: id, tenant_id, name, email, share_percent, notes
* Tenant: id, name
"""

from __future__ import annotations

from api import db_models

# —— Tenants ——
TENANTS: list[db_models.Tenant] = [
    db_models.Tenant(
        id="tenant_a",
        name="Acme & Co. (Denver)",
    ),
    db_models.Tenant(
        id="tenant_b",
        name="Stark Industries (New York)",
    ),
]

# —— tenant_a: clients (emails, totals exercise invoice & analytics) ——
CLIENTS_TENANT_A: list[db_models.Client] = [
    db_models.Client(
        id="c1",
        tenant_id="tenant_a",
        name="Acme Corp",
        email="contact@acme.com",
        total_billed=15_000.0,
    ),
    db_models.Client(
        id="c2",
        tenant_id="tenant_a",
        name="Globex International",
        email="accounts@globex.io",
        total_billed=8_500.0,
    ),
    db_models.Client(
        id="c3a",
        tenant_id="tenant_a",
        name="Nimbus Labs GmbH",
        email="ap@nimbus-labs.de",
        total_billed=22_400.0,
    ),
    db_models.Client(
        id="c4a",
        tenant_id="tenant_a",
        name="Riverside Health System",
        email="ar@riverside-health.org",
        total_billed=3_200.0,
    ),
    db_models.Client(
        id="c5a",
        tenant_id="tenant_a",
        name="Summit Outdoors Co.",
        email="treasury@summit-outdoors.com",
        total_billed=0.0,
    ),
]

# —— tenant_b: clients ——
CLIENTS_TENANT_B: list[db_models.Client] = [
    db_models.Client(
        id="c3",
        tenant_id="tenant_b",
        name="Stark Industries",
        email="billing@stark.com",
        total_billed=50_000.0,
    ),
    db_models.Client(
        id="c6b",
        tenant_id="tenant_b",
        name="Pym Technologies",
        email="invoices@pymtech.io",
        total_billed=12_800.0,
    ),
]

# —— suppliers ——
SUPPLIERS_TENANT_A: list[db_models.Supplier] = [
    db_models.Supplier(
        id="s1",
        tenant_id="tenant_a",
        name="AWS (Amazon Web Services)",
        email="billing@aws.amazon.com",
        total_billed=3_400.0,
    ),
    db_models.Supplier(
        id="s2",
        tenant_id="tenant_a",
        name="Vercel Inc.",
        email="billing@vercel.com",
        total_billed=890.0,
    ),
    db_models.Supplier(
        id="s3a",
        tenant_id="tenant_a",
        name="Slack (Salesforce)",
        email="billing@slack.com",
        total_billed=1_260.0,
    ),
    db_models.Supplier(
        id="s4a",
        tenant_id="tenant_a",
        name="Oman Air Cargo (demo vendor)",
        email="ap@omanair.com",
        total_billed=450.0,
    ),
    db_models.Supplier(
        id="s5a",
        tenant_id="tenant_a",
        name="Dubai FTA e-Services (mock)",
        email="einvoice@dubaifta.gov.ae",
        total_billed=0.0,
    ),
]

SUPPLIERS_TENANT_B: list[db_models.Supplier] = [
    db_models.Supplier(
        id="s3",
        tenant_id="tenant_b",
        name="Microsoft Azure",
        email="azbilling@microsoft.com",
        total_billed=5_200.0,
    ),
    db_models.Supplier(
        id="s6b",
        tenant_id="tenant_b",
        name="Cisco Meraki",
        email="ar@cisco.com",
        total_billed=2_100.0,
    ),
]


def _tx(
    tid: str,
    tx_id: str,
    amount: float,
    day: str,
    tx_type: str,
    category: str,
    recurring: bool,
) -> db_models.Transaction:
    return db_models.Transaction(
        id=tx_id,
        tenant_id=tid,
        amount=amount,
        date=day,
        type=tx_type,
        category=category,
        is_recurring=recurring,
        last_activity=day,
    )


# Income + expenses across months for charts, tax calc, AI forecast, expense search
TRANSACTIONS_TENANT_A: list[db_models.Transaction] = [
    # 2025
    _tx("tenant_a", "t01", 8_000.0, "2025-11-10", "income", "Consulting — Q4", False),
    _tx("tenant_a", "t02", -1_100.0, "2025-11-12", "expense", "AWS Cloud", True),
    _tx("tenant_a", "t03", -49.0, "2025-11-15", "expense", "SaaS — JetBrains", True),
    _tx("tenant_a", "t04", 3_200.0, "2025-12-02", "income", "Retainer", False),
    _tx("tenant_a", "t05", -120.0, "2025-12-05", "expense", "Vercel Hosting", True),
    _tx("tenant_a", "t06", -2_500.0, "2025-12-20", "expense", "Payroll (contractor)", False),
    _tx("tenant_a", "t07", 4_500.0, "2026-01-08", "income", "Consulting", False),
    _tx("tenant_a", "t08", -1_150.0, "2026-01-10", "expense", "AWS Cloud", True),
    _tx("tenant_a", "t09", -80.0, "2026-01-12", "expense", "Cloud — Azure (trial)", True),
    _tx("tenant_a", "t10", -340.0, "2026-01-18", "expense", "Office — WeWork", False),
    # 2026
    _tx("tenant_a", "t11", 5_000.0, "2026-04-01", "income", "Consulting", False),
    _tx("tenant_a", "t12", -1_200.0, "2026-04-02", "expense", "AWS Cloud", True),
    _tx("tenant_a", "t13", -50.0, "2026-02-15", "expense", "Old Subscription", True),
    _tx("tenant_a", "t14", -200.0, "2026-04-10", "expense", "Vercel Hosting", True),
    _tx("tenant_a", "t15", 1_200.0, "2026-02-20", "income", "Licensing", False),
    _tx("tenant_a", "t16", -900.0, "2026-03-01", "expense", "Legal — retainer", False),
    _tx("tenant_a", "t17", -420.0, "2026-03-12", "expense", "Travel — team offsite", False),
    _tx("tenant_a", "t18", 6_200.0, "2026-03-25", "income", "Milestone — Nimbus", False),
    _tx("tenant_a", "t19", -75.0, "2026-04-15", "expense", "Marketing — Google Ads", False),
    _tx("tenant_a", "t20", -1_260.0, "2026-04-20", "expense", "Slack (Salesforce)", True),
    _tx("tenant_a", "t21", 950.0, "2025-10-01", "income", "Interest income", False),
    _tx("tenant_a", "t22", -88.0, "2025-10-20", "expense", "SaaS — Figma", True),
    _tx("tenant_a", "t23", -15.0, "2025-09-30", "expense", "Bank fees", False),
]

TRANSACTIONS_TENANT_B: list[db_models.Transaction] = [
    _tx("tenant_b", "t24", 25_000.0, "2026-04-05", "income", "Engineering", False),
    _tx("tenant_b", "t25", 18_000.0, "2026-03-28", "income", "Defense R&D (grant)", False),
    _tx("tenant_b", "t26", -5_200.0, "2026-04-01", "expense", "Microsoft Azure", True),
    _tx("tenant_b", "t27", -2_100.0, "2026-04-12", "expense", "Cisco Meraki", True),
    _tx("tenant_b", "t28", 4_200.0, "2026-01-15", "income", "Licensing (Arc reactor)", False),
    _tx("tenant_b", "t29", -800.0, "2026-02-10", "expense", "Payroll", False),
    _tx("tenant_b", "t30", 9_000.0, "2025-12-20", "income", "Engineering", False),
]

# share_percent: Numeric(6,3) — use values that fit
STOCKHOLDERS_TENANT_A: list[db_models.Stockholder] = [
    db_models.Stockholder(
        id="sh1",
        tenant_id="tenant_a",
        name="Jane Investor",
        email="jane@example.com",
        share_percent=12.5,
        notes="Seed investor; pro-rata rights. Board observer.",
    ),
    db_models.Stockholder(
        id="sh2",
        tenant_id="tenant_a",
        name="Omar Al-Fares",
        email="o.alfares@partners.gulf",
        share_percent=7.25,
        notes="Strategic contact for GCC expansion.",
    ),
    db_models.Stockholder(
        id="sh3",
        tenant_id="tenant_a",
        name="Cedar Fund II LP",
        email="ir@cedar-fund.com",
        share_percent=33.333,
        notes="Institutional; quarterly reporting.",
    ),
    db_models.Stockholder(
        id="sh4",
        tenant_id="tenant_a",
        name="Elena Voss (optional pool)",
        email="elena@local",
        share_percent=None,
        notes="ESOP pool — allocation TBD. share_percent may be null.",
    ),
]

STOCKHOLDERS_TENANT_B: list[db_models.Stockholder] = [
    db_models.Stockholder(
        id="sh5",
        tenant_id="tenant_b",
        name="Howard Trust",
        email="trust@starkheirs.com",
        share_percent=100.0,
        notes="Holding company (demo).",
    ),
]


def all_seed_rows() -> list:
    return [
        *TENANTS,
        *CLIENTS_TENANT_A,
        *CLIENTS_TENANT_B,
        *SUPPLIERS_TENANT_A,
        *SUPPLIERS_TENANT_B,
        *TRANSACTIONS_TENANT_A,
        *TRANSACTIONS_TENANT_B,
        *STOCKHOLDERS_TENANT_A,
        *STOCKHOLDERS_TENANT_B,
    ]
