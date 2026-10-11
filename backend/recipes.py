# Rescue Kitchen endpoint: POST /recipes
# Hook it up in your main FastAPI file with:
#     from recipes import router as recipes_router
#     app.include_router(recipes_router)
import json
import os
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from typing import List, Literal, Optional

from fastapi import APIRouter, HTTPException
from google.genai import types
from pydantic import BaseModel

from gemini_client import get_client, model_name

# Free key from https://unsplash.com/developers . If it is missing, falls back to TheMealDB (no key needed).
UNSPLASH_ACCESS_KEY = os.getenv("UNSPLASH_ACCESS_KEY")
_image_cache = {}
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
    image_query: str


class Hack(BaseModel):
    title: str
    description: str
    steps: List[str]


class RecipesResponse(BaseModel):
    recipes: List[Recipe]
    hacks: List[Hack]


class RecipeOut(Recipe):
    image_url: Optional[str] = None


class RecipesOut(BaseModel):
    recipes: List[RecipeOut]
    hacks: List[Hack]


def _get_json(url: str, headers: dict) -> dict:
    req = urllib.request.Request(url, headers={"User-Agent": "Ripe/1.0", **headers})
    with urllib.request.urlopen(req, timeout=5) as r:
        return json.loads(r.read())


def find_image(query: str) -> Optional[str]:
    # Same dish twice? Reuse the photo so we don't burn Unsplash's 50/hour limit
    if query in _image_cache:
        return _image_cache[query]
    url = None
    if UNSPLASH_ACCESS_KEY:
        try:
            data = _get_json(
                "https://api.unsplash.com/search/photos?"
                + urllib.parse.urlencode({"query": query, "per_page": 1, "orientation": "landscape"}),
                {"Authorization": f"Client-ID {UNSPLASH_ACCESS_KEY}"},
            )
            results = data.get("results", [])
            if results:
                url = results[0]["urls"]["small"]
        except Exception as e:
            print("unsplash error:", e)
    if not url:
        try:
            data = _get_json(
                "https://www.themealdb.com/api/json/v1/1/search.php?"
                + urllib.parse.urlencode({"s": query}),
                {},
            )
            meals = data.get("meals") or []
            if meals:
                url = meals[0]["strMealThumb"]
        except Exception as e:
            print("mealdb error:", e)
    _image_cache[query] = url
    return url


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
- image_query: 2 to 4 words describing the finished dish for a stock photo search, like "banana bread loaf".

Rules for hacks:
- Practical storage tricks to make THIS item last longer (fridge, freezer, wrapping, keeping away
  from ethylene producers, etc.). Each has a title under 6 words, a one-sentence description, and 2 to 3 short steps.
- Only real, well-known techniques. Do not invent numbers or measurements.

If the label is "compost", recipes can be empty and hacks should be about composting it well
and storing the NEXT one better.

Never claim the food is safe to eat or free of bacteria, mold toxins or pathogens. This app
checks freshness only. If an item shows mold, do not suggest eating the moldy part.
"""


@router.post("/recipes", response_model=RecipesOut)
def get_recipes(req: RecipeRequest):
    prompt = PROMPT.format(
        name=req.name,
        category=req.category,
        label=req.label,
        score=req.score,
        days_left="unknown" if req.days_left is None else req.days_left,
    )
    try:
        resp = get_client().models.generate_content(
            model=model_name(),
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=RecipesResponse,
                temperature=0.7,
            ),
        )
        data = RecipesResponse(**json.loads(resp.text))
        # Look up all 3 photos at the same time instead of one after another
        with ThreadPoolExecutor(max_workers=3) as pool:
            urls = list(pool.map(find_image, [r.image_query for r in data.recipes]))
        recipes = [RecipeOut(**r.model_dump(), image_url=u) for r, u in zip(data.recipes, urls)]
        return RecipesOut(recipes=recipes, hacks=data.hacks)
    except Exception as e:
        print("recipes error:", e)
        raise HTTPException(status_code=502, detail="Could not generate recipes")
