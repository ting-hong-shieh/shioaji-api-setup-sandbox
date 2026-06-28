from __future__ import annotations

from ipaddress import ip_address
from pathlib import Path
from typing import Any, Callable
from urllib.parse import urlsplit

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from shioaji_tester import (
    Credentials,
    ShioajiTestError,
    run_full_check,
)


BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
TEMPLATES_DIR = BASE_DIR / "templates"

app = FastAPI(title="Shioaji API 啟用測試工具")
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


def _render(name: str) -> str:
    return (TEMPLATES_DIR / name).read_text(encoding="utf-8")

LOOPBACK_HOSTNAMES = {"localhost"}
LOOPBACK_ERROR = "這個測試工具只接受來自本機 loopback 的連線，請使用 http://127.0.0.1:8011 或 http://localhost:8011。"


class TestRequest(BaseModel):
    api_key: str
    secret_key: str


@app.middleware("http")
async def enforce_loopback_only(request: Request, call_next):
    client_host = request.client.host if request.client else ""
    host_header = request.headers.get("host", "")

    if not _is_loopback_host(client_host):
        return _loopback_rejection()

    if host_header and not _is_loopback_host(_hostname_from_header(host_header)):
        return _loopback_rejection()

    if request.url.path.startswith("/api/"):
        origin = request.headers.get("origin")
        referer = request.headers.get("referer")
        if (origin and not _is_loopback_url(origin)) or (
            referer and not _is_loopback_url(referer)
        ):
            return _loopback_rejection()

    return await call_next(request)


@app.get("/", response_class=HTMLResponse)
def index() -> str:
    return _render("index.html")


@app.post("/api/full-check")
def full_check(payload: TestRequest) -> JSONResponse:
    return _run_test(payload, run_full_check)


def _run_test(
    payload: TestRequest,
    runner: Callable[..., dict[str, Any]],
) -> JSONResponse:
    try:
        result = runner(
            Credentials(api_key=payload.api_key, secret_key=payload.secret_key),
            simulation=True,
        )
        return JSONResponse({"ok": True, "result": result})
    except ShioajiTestError as exc:
        return JSONResponse({"ok": False, "error": str(exc)}, status_code=400)


def _loopback_rejection() -> JSONResponse:
    return JSONResponse({"ok": False, "error": LOOPBACK_ERROR}, status_code=403)


def _is_loopback_host(host: str) -> bool:
    if not host:
        return False

    normalized = host.strip().strip("[]").lower()
    if normalized in LOOPBACK_HOSTNAMES:
        return True

    try:
        return ip_address(normalized).is_loopback
    except ValueError:
        return False


def _hostname_from_header(value: str) -> str:
    parsed = urlsplit(f"//{value}")
    return parsed.hostname or value


def _is_loopback_url(value: str) -> bool:
    parsed = urlsplit(value)
    return _is_loopback_host(parsed.hostname or "")
