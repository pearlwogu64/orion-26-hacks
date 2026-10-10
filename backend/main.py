import asyncio
import logging
import os
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, File, Request, UploadFile
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from contract import ERROR_TYPES, MOCK_SUCCESS, error_response
from gemini_client import analyze_image
from normalize import normalize

load_dotenv()

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("fresh-check")

MAX_UPLOAD_BYTES = 5 * 1024 * 1024

app = FastAPI(title="Fresh Check API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


def mock_mode() -> bool:
    return os.getenv("MOCK_MODE", "false").lower() == "true" or not os.getenv("GEMINI_API_KEY")


@app.exception_handler(RequestValidationError)
async def on_validation_error(request: Request, exc: RequestValidationError):
    return JSONResponse(error_response("server_error", "Invalid request. Send the photo as multipart field 'image'."))


@app.exception_handler(StarletteHTTPException)
async def on_http_error(request: Request, exc: StarletteHTTPException):
    return JSONResponse(error_response("server_error"), status_code=exc.status_code)


@app.exception_handler(Exception)
async def on_unhandled_error(request: Request, exc: Exception):
    log.exception("Unhandled error")
    return JSONResponse(error_response("server_error"), status_code=500)


@app.get("/health")
async def health():
    return {"ok": True}


def detect_image_type(data: bytes, declared: Optional[str]) -> Optional[str]:
    # Expo sometimes uploads with a missing or generic content type, so sniff the bytes.
    if data.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if data.startswith(b"\x89PNG"):
        return "image/png"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    if data[4:12] in (b"ftypheic", b"ftypheix", b"ftypmif1", b"ftyphevc"):
        return "image/heic"
    if declared and declared.startswith("image/"):
        return declared
    return None


@app.post("/analyze")
async def analyze(image: Optional[UploadFile] = File(None), mock: Optional[str] = None):
    if mock_mode():
        if mock in ERROR_TYPES:
            return error_response(mock)
        return MOCK_SUCCESS

    if image is None:
        return error_response("server_error", "No photo received. Send it as multipart field 'image'.")

    data = await image.read(MAX_UPLOAD_BYTES + 1)
    if len(data) > MAX_UPLOAD_BYTES:
        return error_response("unclear_image", "That photo is too large. Please try a smaller one.")
    mime_type = detect_image_type(data, image.content_type)
    if not data or mime_type is None:
        return error_response("unclear_image", "We couldn't read that file as a photo. Please try again.")

    try:
        raw = await analyze_image(data, mime_type)
    except asyncio.TimeoutError:
        log.warning("Gemini timed out")
        return error_response("server_error", "The analysis took too long. Please try again.")
    except Exception:
        log.exception("Gemini call failed")
        return error_response("server_error")

    try:
        return normalize(raw)
    except Exception:
        log.exception("Gemini returned unusable output: %s", raw)
        return error_response("server_error")
