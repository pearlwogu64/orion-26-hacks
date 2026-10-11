import asyncio
import logging
import os
from typing import Optional

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, File, Request, UploadFile
from fastapi.exception_handlers import http_exception_handler, request_validation_exception_handler
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from starlette.exceptions import HTTPException as StarletteHTTPException

from contract import ERROR_TYPES, MOCK_SUCCESS, error_response
from gemini_client import analyze_image
from impact import FOOD_IMPACT, find_food
from normalize import normalize
from recipes import router as recipes_router

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("fresh-check")

MAX_UPLOAD_BYTES = 5 * 1024 * 1024

app = FastAPI(title="Fresh Check API")
app.include_router(recipes_router)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


def mock_mode() -> bool:
    return os.getenv("MOCK_MODE", "false").lower() == "true" or not os.getenv("GEMINI_API_KEY")


# /analyze must always answer with the contract's error shape; other routes keep FastAPI's defaults.
@app.exception_handler(RequestValidationError)
async def on_validation_error(request: Request, exc: RequestValidationError):
    if request.url.path != "/analyze":
        return await request_validation_exception_handler(request, exc)
    return JSONResponse(error_response("server_error", "Invalid request. Send the photo as multipart field 'image'."))


@app.exception_handler(StarletteHTTPException)
async def on_http_error(request: Request, exc: StarletteHTTPException):
    if request.url.path != "/analyze":
        return await http_exception_handler(request, exc)
    return JSONResponse(error_response("server_error"), status_code=exc.status_code)


@app.exception_handler(Exception)
async def on_unhandled_error(request: Request, exc: Exception):
    log.exception("Unhandled error")
    if request.url.path != "/analyze":
        return JSONResponse({"detail": "Internal server error"}, status_code=500)
    return JSONResponse(error_response("server_error"), status_code=500)


@app.get("/")
def home():
    return {"message": "Fresh Check backend is running"}


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
    if mock in ERROR_TYPES:
        return error_response(mock)
    if mock_mode():
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


# Running "food saved" totals. They reset when the server restarts, which is fine for a demo.
totals = {"kg_saved": 0.0, "co2_saved": 0.0, "money_saved": 0.0, "items_saved": 0}


class ImpactRequest(BaseModel):
    item: str
    action: str


@app.post("/impact")
def impact(request: ImpactRequest):
    food = find_food(request.item)

    if food is None:
        return {"rescued": False, "message": "We don't have impact data for this food yet."}

    if request.action == "compost":
        return {"rescued": False, "message": "Too far gone, but composting keeps it out of landfill."}

    data = FOOD_IMPACT[food]
    kg = data["weight_kg"]
    co2 = kg * data["co2_per_kg"]
    money = data["price_usd"]

    totals["kg_saved"] += kg
    totals["co2_saved"] += co2
    totals["money_saved"] += money
    totals["items_saved"] += 1

    return {
        "rescued": True,
        "food": food,
        "kg_saved": round(kg, 3),
        "co2_saved_kg": round(co2, 3),
        "money_saved_usd": round(money, 2),
        "totals": {
            "kg_saved": round(totals["kg_saved"], 3),
            "co2_saved": round(totals["co2_saved"], 3),
            "money_saved": round(totals["money_saved"], 2),
            "items_saved": totals["items_saved"],
        },
    }


@app.get("/impact/totals")
def get_totals():
    return totals
