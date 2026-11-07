"""Unified Swagger entry point.

``contracts/openapi.json`` at the repository root is the single source of truth
for every backend, so the schema FastAPI would generate is disabled
(``openapi_url=None``). These routes serve the repository contract plus a
CDN-hosted Swagger UI instead. The contract location is resolved once at
startup by walking up at most five directories from the process working
directory; missing files surface as a logged 500 instead of a startup crash.
"""

from __future__ import annotations

import logging
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, HTMLResponse, RedirectResponse

logger = logging.getLogger("orange.swagger")

CONTRACT_RELATIVE_PATH = Path("contracts") / "openapi.json"
MAX_ANCESTOR_LEVELS = 5

SWAGGER_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Orange API</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({url:'/openapi.json', dom_id:'#swagger-ui', persistAuthorization:true, docExpansion:'none'});
  </script>
</body>
</html>
"""

# Filled by load_contract() during startup; the filesystem walk never happens per request.
_contract_file: Path | None = None


def locate_contract(start: Path | None = None) -> Path | None:
    """Walk from *start* (default: cwd) up to five ancestors for the contract."""
    directory = (start or Path.cwd()).resolve()
    for _ in range(MAX_ANCESTOR_LEVELS + 1):
        candidate = directory / CONTRACT_RELATIVE_PATH
        if candidate.is_file():
            return candidate
        parent = directory.parent
        if parent == directory:
            break
        directory = parent
    return None


def load_contract() -> Path | None:
    """Resolve and cache the contract path (called once from the lifespan)."""
    global _contract_file
    _contract_file = locate_contract()
    if _contract_file is None:
        logger.warning(
            "contracts/openapi.json not found within %d levels above %s",
            MAX_ANCESTOR_LEVELS,
            Path.cwd(),
        )
    return _contract_file


def contract_file() -> Path:
    """Cached contract path; a missing file is a logged 500, not a 404."""
    if _contract_file is None:
        load_contract()
    if _contract_file is None:
        logger.error(
            "contracts/openapi.json not found within %d levels above %s",
            MAX_ANCESTOR_LEVELS,
            Path.cwd(),
        )
        raise HTTPException(status_code=500, detail="contracts/openapi.json not found")
    return _contract_file


router = APIRouter(tags=["docs"])


@router.get("/openapi.json", include_in_schema=False)
def openapi_contract() -> FileResponse:
    return FileResponse(contract_file(), media_type="application/json")


@router.get("/swagger", include_in_schema=False, response_class=HTMLResponse)
def swagger_ui() -> HTMLResponse:
    return HTMLResponse(SWAGGER_HTML)


@router.get("/docs", include_in_schema=False)
def swagger_redirect() -> RedirectResponse:
    # The framework-generated /docs used to live here; keep old links working.
    return RedirectResponse("/swagger", status_code=302)
