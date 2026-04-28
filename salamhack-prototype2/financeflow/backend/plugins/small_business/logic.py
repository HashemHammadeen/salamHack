"""Small business suite: hub metadata and health for future feature APIs."""

from __future__ import annotations

from fastapi import APIRouter

router = APIRouter()


@router.get("/small_business/health")
def suite_health():
    return {
        "ok": True,
        "suite": "small_business",
        "version": "0.1.0",
    }
