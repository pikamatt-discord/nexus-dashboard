import os
import stat
from datetime import datetime, timezone
from typing import List, Dict, Any

SAFE_ROOT = os.path.abspath(os.environ.get("NEXUS_FILE_ROOT", "/"))

def _is_safe_path(path: str) -> bool:
    abs_path = os.path.abspath(path)
    return abs_path.startswith(SAFE_ROOT) or abs_path.startswith("/var") or abs_path.startswith("/etc") or abs_path.startswith("/home") or abs_path.startswith("/app")

def list_directory(target_path: str = "/") -> Dict[str, Any]:
    abs_path = os.path.abspath(target_path)
    if not _is_safe_path(abs_path):
        raise PermissionError(f"Access to path '{target_path}' is restricted.")
    if not os.path.exists(abs_path):
        raise FileNotFoundError(f"Path does not exist: {target_path}")
    if not os.path.isdir(abs_path):
        raise ValueError(f"Path is not a directory: {target_path}")

    items = []
    try:
        with os.scandir(abs_path) as entries:
            for entry in entries:
                try:
                    info = entry.stat(follow_symlinks=False)
                    is_dir = entry.is_dir(follow_symlinks=False)
                    items.append({
                        "name": entry.name,
                        "path": entry.path,
                        "is_dir": is_dir,
                        "size_bytes": info.st_size if not is_dir else 0,
                        "modified_at": datetime.fromtimestamp(info.st_mtime, tz=timezone.utc).isoformat(),
                        "permissions": oct(stat.S_IMODE(info.st_mode)),
                    })
                except PermissionError:
                    continue
    except PermissionError:
        raise PermissionError(f"Permission denied accessing directory: {target_path}")

    # Sort directories first, then files alphabetically
    items.sort(key=lambda x: (not x["is_dir"], x["name"].lower()))

    return {
        "current_path": abs_path,
        "parent_path": os.path.dirname(abs_path) if abs_path != "/" else "/",
        "items": items,
    }

def read_file_content(filepath: str, max_bytes: int = 500000) -> Dict[str, Any]:
    abs_path = os.path.abspath(filepath)
    if not _is_safe_path(abs_path):
        raise PermissionError(f"Access to path '{filepath}' is restricted.")
    if not os.path.exists(abs_path):
        raise FileNotFoundError(f"File not found: {filepath}")
    if os.path.isdir(abs_path):
        raise ValueError("Cannot read directory as file content")

    info = os.stat(abs_path)
    if info.st_size > max_bytes:
        raise ValueError(f"File exceeds preview limit of {max_bytes} bytes")

    try:
        with open(abs_path, "r", encoding="utf-8", errors="replace") as f:
            content = f.read()
        return {
            "path": abs_path,
            "filename": os.path.basename(abs_path),
            "size_bytes": info.st_size,
            "content": content,
        }
    except Exception as e:
        raise RuntimeError(f"Failed to read file: {str(e)}")
