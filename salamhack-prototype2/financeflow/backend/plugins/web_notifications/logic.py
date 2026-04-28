"""
No server push delivery yet: the UI uses the browser Notification API.
This router keeps tenant-scoped hooks for health checks and future VAPID/webpush integration.
"""

from __future__ import annotations

import os

from fastapi import APIRouter

from api.deps import TenantId

router = APIRouter()


@router.get("/web_notifications/status")
def web_notif_status(tenant_id: TenantId):
    vapid = os.environ.get("FF_VAPID_PUBLIC_KEY", "").strip() or None
    return {
        "tenant_id": tenant_id,
        "browser_driven": True,
        "vapid_public_key": vapid,
        "note": "Enable notifications in the plugin panel; optional FF_VAPID_* env vars for future Web Push.",
    }
