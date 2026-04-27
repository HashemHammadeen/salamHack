"""Shared helpers for rich invoice (invoice_document payload) across PDF, XLSX, DOCX."""

from __future__ import annotations

from schemas import InvoiceDocumentPayload, InvoiceLineItemPayload


def line_amount(li: InvoiceLineItemPayload) -> float:
    return float(li.quantity or 0) * float(li.unit_price or 0)


def document_subtotal(d: InvoiceDocumentPayload | None, total_billed: float) -> float:
    if d is None or not d.line_items:
        return float(total_billed)
    s = sum(line_amount(li) for li in d.line_items)
    return s if s > 0 else float(total_billed)
