import asyncio
import json
import os

from google import genai
from google.genai import errors, types

from prompt import PROMPT

_client = None


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    return _client


async def analyze_image(image_bytes: bytes, mime_type: str) -> dict:
    """Send the photo + prompt to Gemini and return its parsed JSON.

    Raises asyncio.TimeoutError on timeout and ValueError if the reply isn't a JSON object.
    """
    model = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
    timeout = float(os.getenv("GEMINI_TIMEOUT_SECONDS", "25"))

    async def call():
        return await _get_client().aio.models.generate_content(
            model=model,
            contents=[
                types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                PROMPT,
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.2,
            ),
        )

    async def call_with_retry():
        try:
            return await call()
        except errors.ServerError:
            # Gemini returns 503 "high demand" spikes that usually clear in a second or two.
            await asyncio.sleep(1.5)
            return await call()

    response = await asyncio.wait_for(call_with_retry(), timeout=timeout)

    data = json.loads(response.text or "")
    if not isinstance(data, dict):
        raise ValueError("Gemini did not return a JSON object")
    return data
