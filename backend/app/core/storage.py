"""Local filesystem storage for business profile documents."""

from __future__ import annotations

import re
import uuid
from pathlib import Path

from fastapi import UploadFile

from app.core.config import get_settings

SAFE_NAME_RE = re.compile(r"[^a-zA-Z0-9._-]+")


def uploads_root() -> Path:
    settings = get_settings()
    root = Path(getattr(settings, "UPLOAD_DIR", "uploads")).resolve()
    root.mkdir(parents=True, exist_ok=True)
    return root


def business_profile_upload_dir(profile_id: uuid.UUID) -> Path:
    path = uploads_root() / "business_profiles" / str(profile_id)
    path.mkdir(parents=True, exist_ok=True)
    return path


def public_upload_url(relative_path: str) -> str:
    settings = get_settings()
    base = getattr(settings, "UPLOAD_BASE_URL", "/uploads").rstrip("/")
    return f"{base}/{relative_path.lstrip('/')}"


async def save_upload_file(
    *,
    profile_id: uuid.UUID,
    upload: UploadFile,
    document_type: str,
) -> tuple[str, str, str, str | None]:
    """Save upload and return (file_name, file_size, file_url, mime_type)."""
    original = upload.filename or f"{document_type}.bin"
    safe = SAFE_NAME_RE.sub("_", original).strip("._") or "document.bin"
    stored_name = f"{uuid.uuid4().hex}_{safe}"
    dest = business_profile_upload_dir(profile_id) / stored_name

    content = await upload.read()
    dest.write_bytes(content)

    relative = f"business_profiles/{profile_id}/{stored_name}"
    size_label = _format_size(len(content))
    url = public_upload_url(relative)
    return safe, size_label, url, upload.content_type


def _format_size(num_bytes: int) -> str:
    if num_bytes < 1024:
        return f"{num_bytes} B"
    kb = num_bytes / 1024
    if kb < 1024:
        return f"{kb:.1f} KB"
    return f"{kb / 1024:.1f} MB"
