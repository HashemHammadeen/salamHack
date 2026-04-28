"""
Local / self-hosted utilities: install a plugin by writing files under backend/plugins/.

Set FF_DISABLE_PLUGIN_UPLOAD=1 to block writes (recommended in production).
"""

from __future__ import annotations

import os
import re
from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, field_validator

router = APIRouter(prefix="/api/dev", tags=["dev"])

BACKEND_ROOT = Path(__file__).resolve().parent.parent
PLUGINS_DIR = BACKEND_ROOT / "plugins"

PLUGIN_ID_RE = re.compile(r"^[a-z][a-z0-9_]{1,48}$")


class PluginInstallBody(BaseModel):
    plugin_id: str = Field(..., min_length=2, max_length=50)
    logic_py: str = Field(..., min_length=20)
    manifest_yaml: str | None = None
    overwrite: bool = False

    @field_validator("plugin_id")
    @classmethod
    def validate_id(cls, v: str) -> str:
        t = v.strip()
        if not PLUGIN_ID_RE.fullmatch(t):
            raise ValueError(
                "plugin_id must start with a letter and contain only lowercase letters, digits, and underscores."
            )
        return t


def _upload_disabled() -> bool:
    return os.environ.get("FF_DISABLE_PLUGIN_UPLOAD", "").lower() in ("1", "true", "yes")


def _default_manifest(plugin_id: str) -> str:
    title = plugin_id.replace("_", " ").title()
    return (
        f'name: "{title}"\n'
        f'description: "Custom plugin {plugin_id}."\n'
        'version: "1.0.0"\n'
    )


@router.post("/plugins/install")
def install_plugin(body: PluginInstallBody):
    """
    Write `logic.py` (and optional `manifest.yaml`) into `plugins/<plugin_id>/`.

    Requires a `router = APIRouter()` in logic_py. Restart the API process to load the new plugin.
    """
    if _upload_disabled():
        raise HTTPException(
            status_code=403,
            detail="Plugin upload is disabled (set FF_DISABLE_PLUGIN_UPLOAD=0 on the server to allow).",
        )

    code = body.logic_py
    if "router" not in code or "APIRouter" not in code:
        raise HTTPException(
            status_code=400,
            detail="logic.py must define a FastAPI APIRouter (e.g. router = APIRouter()).",
        )

    dest = PLUGINS_DIR / body.plugin_id
    if dest.exists() and not body.overwrite:
        raise HTTPException(
            status_code=409,
            detail=f"Plugin folder already exists: {body.plugin_id}. Pass overwrite: true to replace.",
        )

    manifest = body.manifest_yaml.strip() if body.manifest_yaml else _default_manifest(body.plugin_id)
    if "name:" not in manifest:
        raise HTTPException(status_code=400, detail="manifest.yaml must contain a name: field.")

    try:
        dest.mkdir(parents=True, exist_ok=True)
        (dest / "logic.py").write_text(code, encoding="utf-8")
        (dest / "manifest.yaml").write_text(manifest if manifest.endswith("\n") else manifest + "\n", encoding="utf-8")
    except OSError as e:
        raise HTTPException(status_code=500, detail=f"Failed to write files: {e}") from e

    return {
        "ok": True,
        "plugin_id": body.plugin_id,
        "path": str(dest.relative_to(BACKEND_ROOT)),
        "message": "Files written. Restart the API server, then refresh the plugin list in the app.",
    }
