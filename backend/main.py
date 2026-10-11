import os
import json
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from google.genai import types

# load the API key from .env
load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

app = FastAPI()

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