import os
import json
import asyncio
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from google.genai import types

# load the API key from .env
load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

app = FastAPI()
from recipes import router as recipes_router
app.include_router(recipes_router)

# let the Expo frontend talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

PROMPT = """
You are a food freshness checker. Look at the photo and judge how fresh the food is.
This checks visual freshness only, not foodborne illness.

First, list what you observe (color, spots, mold, texture, peel or skin condition).
Then give a freshness_score from 0 to 100 based ONLY on those observations:
- 0 to 30: fresh
- 31 to 60: eat soon
- 61 to 85: past its prime but usable (cook it or freeze it)
- 86 to 100: visible spoilage, compost it

Reference examples:
- banana: 15 = yellow with green tips, 45 = some brown freckles,
  75 = mostly brown and soft, 95 = black, leaking, or moldy
- avocado (cut): 15 = bright green flesh, 50 = some brown patches,
  80 = mostly brown, 95 = mold or stringy black flesh
- strawberry: 15 = bright red and firm, 50 = slightly dull or soft spots,
  95 = any fuzzy mold

Respond with JSON only, in exactly this format:
{
  "item": "name of the food",
  "observations": ["observation 1", "observation 2"],
  "freshness_score": 0,
  "days_left": 0,
  "action": "eat_now" or "cook" or "freeze" or "compost",
  "rescue_idea": "short suggestion for using it",
  "confidence": "high" or "medium" or "low"
}
"""


@app.get("/")
def home():
    return {"message": "Second Bite backend is running"}

@app.get("/health")
def health():
    return {"ok": True}

@app.post("/scan")
async def scan(file: UploadFile = File(...)):
    image_bytes = await file.read()

    response = client.models.generate_content(
        model="gemini-3.8-flash",
        contents=[
            types.Part.from_bytes(data=image_bytes, mime_type=file.content_type),
            PROMPT,
        ],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0,
        ),
    )

    result = json.loads(response.text)
    return result
# CO2 values: kg CO2e per kg of food, from Our World in Data (Poore & Nemecek 2018)
# weight_kg: rough average weight of one item
# price_usd: rough price of one item (double-check against H-E-B prices)
FOOD_IMPACT = {
    "banana":     {"co2_per_kg": 0.86, "weight_kg": 0.12, "price_usd": 0.25},
    "apple":      {"co2_per_kg": 0.43, "weight_kg": 0.18, "price_usd": 0.75},
    "tomato":     {"co2_per_kg": 2.09, "weight_kg": 0.15, "price_usd": 0.50},
    "strawberry": {"co2_per_kg": 1.53, "weight_kg": 0.45, "price_usd": 3.00},
    "avocado":    {"co2_per_kg": 1.05, "weight_kg": 0.17, "price_usd": 1.00},
    "bread":      {"co2_per_kg": 1.57, "weight_kg": 0.45, "price_usd": 2.50},
    "lettuce":    {"co2_per_kg": 0.53, "weight_kg": 0.50, "price_usd": 1.50},
}

# running totals (reset when the server restarts, fine for a demo)
totals = {"kg_saved": 0.0, "co2_saved": 0.0, "money_saved": 0.0, "items_saved": 0}


class ImpactRequest(BaseModel):
    item: str
    action: str


def find_food(item_name):
    name = item_name.lower()
    for food in FOOD_IMPACT:
        if food in name:
            return food
    return None


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

ANALYZE_PROMPT = """
You are a food freshness checker. Look at the photo and judge how fresh the food is.
This checks visual freshness only, not foodborne illness.

If the photo is not food, set "problem" to "not_food".
If the photo is too blurry or dark to judge, set "problem" to "unclear_image".
If there is more than one kind of food, set "problem" to "multiple_items".
Otherwise set "problem" to null.

First, list what you observe (color, spots, mold, texture, peel or skin condition).
Then give a freshness_score from 0 to 100 based ONLY on those observations:
- 0 to 30: fresh
- 31 to 60: eat soon
- 61 to 85: past its prime but usable (cook it or freeze it)
- 86 to 100: visible spoilage, compost it

Reference examples:
- banana: 15 = yellow with green tips, 45 = some brown freckles,
  75 = mostly brown and soft, 95 = black, leaking, or moldy
- avocado (cut): 15 = bright green flesh, 50 = some brown patches,
  80 = mostly brown, 95 = mold or stringy black flesh
- strawberry: 15 = bright red and firm, 50 = slightly dull or soft spots,
  95 = any fuzzy mold

Respond with JSON only, in exactly this format:
{
  "problem": null,
  "item": "name of the food",
  "category": "fruit" or "vegetable" or "bread" or "other",
  "observations": ["observation 1", "observation 2"],
  "summary": "one sentence about its condition",
  "freshness_score": 0,
  "days_left": 0,
  "action": "eat" or "cook" or "store" or "compost",
  "tips": ["tip 1", "tip 2"],
  "confidence": "high" or "medium" or "low"
}
"""

ERROR_MESSAGES = {
    "not_food": "That doesn't look like food. Try a photo of one fruit, veggie, or bread.",
    "unclear_image": "The photo is too blurry or dark. Try again in better light.",
    "multiple_items": "Too many items in one photo. Try one food at a time.",
}


def score_to_label(score):
    if score <= 30:
        return "fresh"
    if score <= 60:
        return "use_soon"
    if score <= 85:
        return "use_now"
    return "compost"


def error_result(error_type, message):
    return {"status": "error", "error_type": error_type, "message": message}


@app.post("/analyze")
async def analyze(image: UploadFile = File(...)):
    try:
        image_bytes = await image.read()

        for attempt in range(3):
            try:
                response = client.models.generate_content(
                    model="gemini-3.5-flash-lite",
                    contents=[
                        types.Part.from_bytes(data=image_bytes, mime_type=image.content_type or "image/jpeg"),
                        ANALYZE_PROMPT,
                    ],
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        temperature=0,
                    ),
                )
                break
            except Exception as e:
                if "503" not in str(e) or attempt == 2:
                    raise
                await asyncio.sleep(2)

        ai = json.loads(response.text)

        problem = ai.get("problem")
        if problem in ERROR_MESSAGES:
            return error_result(problem, ERROR_MESSAGES[problem])

        score = max(0, min(100, int(ai.get("freshness_score", 50))))

        category = ai.get("category")
        if category not in ("fruit", "vegetable", "bread", "other"):
            category = "other"

        action = ai.get("action")
        if action not in ("eat", "cook", "store", "compost"):
            action = "eat"

        confidence = ai.get("confidence")
        if confidence not in ("high", "medium", "low"):
            confidence = "medium"

        days_left = ai.get("days_left")
        days_left = int(days_left) if days_left is not None else None

        co2 = 0.0
        money = 0.0
        food = find_food(ai.get("item", ""))
        if food is not None and action != "compost":
            data = FOOD_IMPACT[food]
            co2 = data["weight_kg"] * data["co2_per_kg"]
            money = data["price_usd"]

        return {
            "status": "success",
            "item": {"name": ai.get("item", "unknown"), "category": category},
            "freshness": {
                "score": score,
                "label": score_to_label(score),
                "confidence": confidence,
                "estimated_days_left": days_left,
            },
            "analysis": {
                "visual_signs": ai.get("observations", []),
                "summary": ai.get("summary", ""),
            },
            "recommendation": {"action": action, "tips": ai.get("tips", [])},
            "impact": {"co2_saved_kg": round(co2, 3), "money_saved_usd": round(money, 2)},
        }
    except Exception as e:
        print("ANALYZE FAILED:", e)
        return error_result("server_error", "Something went wrong analyzing the photo. Try again.")