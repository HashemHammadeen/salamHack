"""
SMTP email: set FF_SMTP_HOST, FF_SMTP_PORT, FF_SMTP_USER, FF_SMTP_PASSWORD, FF_SMTP_FROM.
FF_SMTP_USE_TLS defaults to true (set to 0 for plain).
"""

from __future__ import annotations

import os
import smtplib
from email.message import EmailMessage

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr

from api.deps import TenantId

router = APIRouter()


def _smtp_settings() -> tuple[str, int, str, str | None, str, bool]:
    host = os.environ.get("FF_SMTP_HOST", "").strip()
    try:
        port = int(os.environ.get("FF_SMTP_PORT", "587") or 587)
    except ValueError:
        port = 587
    user = os.environ.get("FF_SMTP_USER", "").strip()
    password = (os.environ.get("FF_SMTP_PASSWORD") or "").strip() or None
    from_addr = (os.environ.get("FF_SMTP_FROM") or user or "").strip()
    use_tls = os.environ.get("FF_SMTP_USE_TLS", "1").lower() in ("1", "true", "yes", "on")
    return host, port, user, password, from_addr, use_tls


def _configured() -> bool:
    h, _p, u, pw, f, _t = _smtp_settings()
    return bool(h and u and pw and f)


@router.get("/email_notifications/status")
def email_status(tenant_id: TenantId):
    h, port, u, _pw, f, use_tls = _smtp_settings()
    return {
        "tenant_id": tenant_id,
        "configured": _configured(),
        "host": h or None,
        "port": port,
        "user_set": bool(u),
        "from_address": f or None,
        "use_tls": use_tls,
    }


class TestEmailBody(BaseModel):
    to: EmailStr
    subject: str | None = "FinanceFlow — test email"
    text: str | None = None


@router.post("/email_notifications/test")
def send_test_email(tenant_id: TenantId, body: TestEmailBody):
    if not _configured():
        raise HTTPException(
            status_code=503,
            detail="SMTP is not configured. Set FF_SMTP_HOST, FF_SMTP_USER, FF_SMTP_PASSWORD, "
            "and FF_SMTP_FROM (optional FF_SMTP_PORT, FF_SMTP_USE_TLS) in the API environment.",
        )
    host, port, user, password, from_addr, use_tls = _smtp_settings()
    if password is None:
        raise HTTPException(status_code=503, detail="FF_SMTP_PASSWORD is missing.")

    text = (body.text or "").strip() or (
        f"This is a test from FinanceFlow for tenant {tenant_id}. If you received this, SMTP is set up."
    )
    subj = (body.subject or "FinanceFlow — test email").strip()

    msg = EmailMessage()
    msg["Subject"] = subj
    msg["From"] = from_addr
    msg["To"] = body.to
    msg.set_content(text)

    try:
        with smtplib.SMTP(host, port, timeout=30) as smtp:
            if use_tls:
                smtp.starttls()
            smtp.login(user, password)
            smtp.send_message(msg)
    except OSError as e:
        raise HTTPException(status_code=502, detail=f"SMTP connection failed: {e}") from e
    except smtplib.SMTPException as e:
        raise HTTPException(status_code=502, detail=f"SMTP error: {e}") from e

    return {"ok": True, "to": body.to, "message": "Message accepted by the mail server."}
