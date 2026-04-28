"""
Comprehensive mock rows for local/demo DB seeding. Matches db_models (every column).

* Client / Supplier: id, tenant_id, name, email, total_billed
* Transaction: id, tenant_id, amount, date, type, category, is_recurring, last_activity
* Stockholder: id, tenant_id, name, email, share_percent, notes
* Tenant: id, name
"""

from __future__ import annotations

from api import db_models

TID = "default"

# —— One built-in org (no multi-tenant UI) ——
TENANTS: list[db_models.Tenant] = [
    db_models.Tenant(
        id=TID,
        name="Acme & Co. (Denver) — combined demo",
    ),
]

# —— clients ——
CLIENTS: list[db_models.Client] = [
    db_models.Client(
        id="c1",
        tenant_id=TID,
        name="Acme Corp",
        email="contact@acme.com",
        total_billed=15_000.0,
    ),
    db_models.Client(
        id="c2",
        tenant_id=TID,
        name="Globex International",
        email="accounts@globex.io",
        total_billed=8_500.0,
    ),
    db_models.Client(
        id="c3a",
        tenant_id=TID,
        name="Nimbus Labs GmbH",
        email="ap@nimbus-labs.de",
        total_billed=22_400.0,
    ),
    db_models.Client(
        id="c4a",
        tenant_id=TID,
        name="Riverside Health System",
        email="ar@riverside-health.org",
        total_billed=3_200.0,
    ),
    db_models.Client(
        id="c5a",
        tenant_id=TID,
        name="Summit Outdoors Co.",
        email="treasury@summit-outdoors.com",
        total_billed=0.0,
    ),
    db_models.Client(
        id="c3",
        tenant_id=TID,
        name="Stark Industries",
        email="billing@stark.com",
        total_billed=50_000.0,
    ),
    db_models.Client(
        id="c6b",
        tenant_id=TID,
        name="Pym Technologies",
        email="invoices@pymtech.io",
        total_billed=12_800.0,
    ),
]

# —— suppliers ——
SUPPLIERS: list[db_models.Supplier] = [
    db_models.Supplier(
        id="s1",
        tenant_id=TID,
        name="AWS (Amazon Web Services)",
        email="billing@aws.amazon.com",
        total_billed=3_400.0,
    ),
    db_models.Supplier(
        id="s2",
        tenant_id=TID,
        name="Vercel Inc.",
        email="billing@vercel.com",
        total_billed=890.0,
    ),
    db_models.Supplier(
        id="s3a",
        tenant_id=TID,
        name="Slack (Salesforce)",
        email="billing@slack.com",
        total_billed=1_260.0,
    ),
    db_models.Supplier(
        id="s4a",
        tenant_id=TID,
        name="Oman Air Cargo (demo vendor)",
        email="ap@omanair.com",
        total_billed=450.0,
    ),
    db_models.Supplier(
        id="s5a",
        tenant_id=TID,
        name="Dubai FTA e-Services (mock)",
        email="einvoice@dubaifta.gov.ae",
        total_billed=0.0,
    ),
    db_models.Supplier(
        id="s3",
        tenant_id=TID,
        name="Microsoft Azure",
        email="azbilling@microsoft.com",
        total_billed=5_200.0,
    ),
    db_models.Supplier(
        id="s6b",
        tenant_id=TID,
        name="Cisco Meraki",
        email="ar@cisco.com",
        total_billed=2_100.0,
    ),
]


def _tx(
    tx_id: str,
    amount: float,
    day: str,
    tx_type: str,
    category: str,
    recurring: bool,
) -> db_models.Transaction:
    return db_models.Transaction(
        id=tx_id,
        tenant_id=TID,
        amount=amount,
        date=day,
        type=tx_type,
        category=category,
        is_recurring=recurring,
        last_activity=day,
    )


TRANSACTIONS: list[db_models.Transaction] = [
    _tx("t01", 8_000.0, "2025-11-10", "income", "Consulting — Q4", False),
    _tx("t02", -1_100.0, "2025-11-12", "expense", "AWS Cloud", True),
    _tx("t03", -49.0, "2025-11-15", "expense", "SaaS — JetBrains", True),
    _tx("t04", 3_200.0, "2025-12-02", "income", "Retainer", False),
    _tx("t05", -120.0, "2025-12-05", "expense", "Vercel Hosting", True),
    _tx("t06", -2_500.0, "2025-12-20", "expense", "Payroll (contractor)", False),
    _tx("t07", 4_500.0, "2026-01-08", "income", "Consulting", False),
    _tx("t08", -1_150.0, "2026-01-10", "expense", "AWS Cloud", True),
    _tx("t09", -80.0, "2026-01-12", "expense", "Cloud — Azure (trial)", True),
    _tx("t10", -340.0, "2026-01-18", "expense", "Office — WeWork", False),
    _tx("t11", 5_000.0, "2026-04-01", "income", "Consulting", False),
    _tx("t12", -1_200.0, "2026-04-02", "expense", "AWS Cloud", True),
    _tx("t13", -50.0, "2026-02-15", "expense", "Old Subscription", True),
    _tx("t14", -200.0, "2026-04-10", "expense", "Vercel Hosting", True),
    _tx("t15", 1_200.0, "2026-02-20", "income", "Licensing", False),
    _tx("t16", -900.0, "2026-03-01", "expense", "Legal — retainer", False),
    _tx("t17", -420.0, "2026-03-12", "expense", "Travel — team offsite", False),
    _tx("t18", 6_200.0, "2026-03-25", "income", "Milestone — Nimbus", False),
    _tx("t19", -75.0, "2026-04-15", "expense", "Marketing — Google Ads", False),
    _tx("t20", -1_260.0, "2026-04-20", "expense", "Slack (Salesforce)", True),
    _tx("t21", 950.0, "2025-10-01", "income", "Interest income", False),
    _tx("t22", -88.0, "2025-10-20", "expense", "SaaS — Figma", True),
    _tx("t23", -15.0, "2025-09-30", "expense", "Bank fees", False),
    _tx("t24", 25_000.0, "2026-04-05", "income", "Engineering", False),
    _tx("t25", 18_000.0, "2026-03-28", "income", "Defense R&D (grant)", False),
    _tx("t26", -5_200.0, "2026-04-01", "expense", "Microsoft Azure", True),
    _tx("t27", -2_100.0, "2026-04-12", "expense", "Cisco Meraki", True),
    _tx("t28", 4_200.0, "2026-01-15", "income", "Licensing (Arc reactor)", False),
    _tx("t29", -800.0, "2026-02-10", "expense", "Payroll", False),
    _tx("t30", 9_000.0, "2025-12-20", "income", "Engineering", False),
]

STOCKHOLDERS: list[db_models.Stockholder] = [
    db_models.Stockholder(
        id="sh1",
        tenant_id=TID,
        name="Jane Investor",
        email="jane@example.com",
        share_percent=12.5,
        notes="Seed investor; pro-rata rights. Board observer.",
    ),
    db_models.Stockholder(
        id="sh2",
        tenant_id=TID,
        name="Omar Al-Fares",
        email="o.alfares@partners.gulf",
        share_percent=7.25,
        notes="Strategic contact for GCC expansion.",
    ),
    db_models.Stockholder(
        id="sh3",
        tenant_id=TID,
        name="Cedar Fund II LP",
        email="ir@cedar-fund.com",
        share_percent=33.333,
        notes="Institutional; quarterly reporting.",
    ),
    db_models.Stockholder(
        id="sh4",
        tenant_id=TID,
        name="Elena Voss (optional pool)",
        email="elena@local",
        share_percent=None,
        notes="ESOP pool — allocation TBD. share_percent may be null.",
    ),
    db_models.Stockholder(
        id="sh5",
        tenant_id=TID,
        name="Howard Trust",
        email="trust@starkheirs.com",
        share_percent=100.0,
        notes="Holding company (demo).",
    ),
]


def all_seed_rows() -> list:
    return [
        *TENANTS,
        *CLIENTS,
        *SUPPLIERS,
        *TRANSACTIONS,
        *STOCKHOLDERS,
    ]
