# Rescue Kitchen endpoint: POST /recipes
# Hook it up in your main FastAPI file with:
#     from recipes import router as recipes_router
#     app.include_router(recipes_router)
import json
from typing import List, Literal, Optional

from fastapi import APIRouter, HTTPException
from google import genai
from google.genai import types
from pydantic import BaseModel

# Use the same model name your /analyze endpoint already uses
MODEL = "gemini-3.5-flash-lite"

client = genai.Client()  # reads GEMINI_API_KEY from the environment
router = APIRouter()


class RecipeRequest(BaseModel):
    name: str
    category: str
    label: str
    score: int
    days_left: Optional[int] = None


class Recipe(BaseModel):
    title: str
    time_minutes: int
    difficulty: Literal["easy", "medium", "hard"]
    description: str
    ingredients: List[str]
    steps: List[str]


class Hack(BaseModel):
    title: str
    description: str
    steps: List[str]


class RecipesResponse(BaseModel):
    recipes: List[Recipe]
    hacks: List[Hack]


PROMPT = """You are the rescue chef inside Ripe, an app that stops household food waste.

The user scanned ONE item:
- Item: {name}
- Category: {category}
- Freshness label: {label} (fresh / use_soon / use_now / compost)
- Freshness score: {score} out of 100 (0 = perfectly fresh, 100 = spoiled)
- Estimated days left: {days_left}

Return exactly 3 recipes and 2 shelf-life hacks that make sense for an item in THIS condition.

Rules for recipes:
- The scanned item must be the star ingredient.
- Match the condition: very fresh items suit raw or simple dishes; riper or softer items suit
  baking, blending, mashing, soups, sauces, jams or freezing.
- Use common home-kitchen ingredients only. Keep it realistic for a college student.
- The first recipe should be the best match and quickest win.
- title: under 6 words. description: one sentence, under 20 words, says why it suits this item's condition.
- ingredients: 3 to 7 items with amounts, like "2 ripe bananas".
- steps: 3 to 6 short steps, each under 15 words.
- difficulty: easy, medium or hard.

Rules for hacks:
- Practical storage tricks to make THIS item last longer (fridge, freezer, wrapping, keeping away
  from ethylene producers, etc.). Each has a title under 6 words, a one-sentence description, and 2 to 3 short steps.
- Only real, well-known techniques. Do not invent numbers or measurements.

If the label is "compost", recipes can be empty and hacks should be about composting it well
and storing the NEXT one better.

Never claim the food is safe to eat or free of bacteria, mold toxins or pathogens. This app
checks freshness only. If an item shows mold, do not suggest eating the moldy part.
"""


@router.post("/recipes", response_model=RecipesResponse)
def get_recipes(req: RecipeRequest):
    prompt = PROMPT.format(
        name=req.name,
        category=req.category,
        label=req.label,
        score=req.score,
        days_left="unknown" if req.days_left is None else req.days_left,
    )
    try:
        resp = client.models.generate_content(
            model=MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=RecipesResponse,
                temperature=0.7,
            ),
        )
        data = json.loads(resp.text)
        return RecipesResponse(**data)
    except Exception as e:
        print("recipes error:", e)
        raise HTTPException(status_code=502, detail="Could not generate recipes")
