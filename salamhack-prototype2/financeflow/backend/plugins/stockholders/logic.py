"""Stockholders plugin: UI lives in the web app; this router reserved for future API surface."""

from fastapi import APIRouter

router = APIRouter()


@router.get("/stockholders/status")
def status():
    return {"ok": True, "plugin": "stockholders"}
