import asyncio
import json
import os

from google import genai
from google.genai import errors, types

from prompt import ANALYZE_PROMPT

_client = None


def get_client() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    return _client


def model_name() -> str:
    return os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")


async def analyze_image(image_bytes: bytes, mime_type: str) -> dict:
    """Send the photo + prompt to Gemini and return its parsed JSON.

    Raises asyncio.TimeoutError on timeout and ValueError if the reply isn't a JSON object.
    """
    timeout = float(os.getenv("GEMINI_TIMEOUT_SECONDS", "25"))

    async def call():
        return await get_client().aio.models.generate_content(
            model=model_name(),
            contents=[
                types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                ANALYZE_PROMPT,
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0,
            ),
        )

    async def call_with_retry():
        for attempt in range(3):
            try:
                return await call()
            except errors.ServerError:
                # Gemini returns 503 "high demand" spikes that usually clear in a second or two.
                if attempt == 2:
                    raise
                await asyncio.sleep(2)

    response = await asyncio.wait_for(call_with_retry(), timeout=timeout)

    data = json.loads(response.text or "")
    if not isinstance(data, dict):
        raise ValueError("Gemini did not return a JSON object")
    return data
