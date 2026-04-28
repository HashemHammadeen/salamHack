import re
from typing import Literal

from pydantic import BaseModel, Field, field_validator

InvoiceOutputFormat = Literal["pdf", "xlsx", "docx"]
InvoiceFontKey = Literal["Helvetica", "Times-Roman", "Courier"]


class TaxResidencyPayload(BaseModel):
    """Client-provided tax residency; validated client-side. Stored for future invoice PDF lines."""

    country_code: str | None = None
    additional_data: dict[str, str] = Field(default_factory=dict)


class PartyDetailsPayload(BaseModel):
    legal_name: str = ""
    address: str = ""
    tax_id: str = ""
    email: str = ""
    phone: str = ""


class InvoiceLineItemPayload(BaseModel):
    id: str = ""
    description: str = ""
    quantity: float = 0.0
    unit_label: str = "hours"
    unit_price: float = 0.0


class InvoiceDocumentPayload(BaseModel):
    invoice_number: str | None = None
    issue_date: str | None = None
    due_date: str | None = None
    supplier: PartyDetailsPayload = Field(default_factory=PartyDetailsPayload)
    customer: PartyDetailsPayload = Field(default_factory=PartyDetailsPayload)
    line_items: list[InvoiceLineItemPayload] = Field(default_factory=list)
    notes: str = ""


class InvoiceExportConfig(BaseModel):
    output_format: InvoiceOutputFormat = "pdf"
    logo_url: str | None = None
    """Optional data URL (e.g. data:image/png;base64,...) from a browser file pick; used before logo_url."""
    logo_data_url: str | None = None
    font_family: InvoiceFontKey = "Helvetica"
    font_size: int = Field(12, ge=8, le=24)
    primary_color: str = "#141413"
    secondary_color: str = "#CF4500"
    tax_residency: TaxResidencyPayload | None = None
    invoice_document: InvoiceDocumentPayload | None = None

    @field_validator("primary_color", "secondary_color")
    @classmethod
    def validate_hex(cls, v: str) -> str:
        t = v.strip()
        if not re.match(r"^#([0-9A-Fa-f]{6})$", t):
            raise ValueError("Color must be #RRGGBB")
        return t
