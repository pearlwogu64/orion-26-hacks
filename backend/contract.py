"""The locked API contract. Change field names/values only with all four teammates agreeing."""

from typing import Literal, Optional

from pydantic import BaseModel, Field

Category = Literal["fruit", "vegetable", "bread", "other"]
Label = Literal["fresh", "use_soon", "use_now", "compost"]
Confidence = Literal["high", "medium", "low"]
Action = Literal["eat", "cook", "store", "compost"]
ErrorType = Literal["not_food", "unclear_image", "multiple_items", "server_error"]

CATEGORIES = ("fruit", "vegetable", "bread", "other")
CONFIDENCES = ("high", "medium", "low")
ACTIONS = ("eat", "cook", "store", "compost")
ERROR_TYPES = ("not_food", "unclear_image", "multiple_items", "server_error")


class Item(BaseModel):
    name: str
    category: Category


class Freshness(BaseModel):
    score: int = Field(ge=0, le=100)
    label: Label
    confidence: Confidence
    estimated_days_left: Optional[int] = Field(default=None, ge=0)


class Analysis(BaseModel):
    visual_signs: list[str] = Field(min_length=1, max_length=4)
    summary: str


class Recommendation(BaseModel):
    action: Action
    tips: list[str] = Field(default_factory=list, max_length=3)


class Impact(BaseModel):
    co2_saved_kg: float
    money_saved_usd: float


class SuccessResponse(BaseModel):
    status: Literal["success"] = "success"
    item: Item
    freshness: Freshness
    analysis: Analysis
    recommendation: Recommendation
    impact: Impact


class ErrorResponse(BaseModel):
    status: Literal["error"] = "error"
    error_type: ErrorType
    message: str


ERROR_MESSAGES = {
    "not_food": "We couldn't spot a food item in this photo. Try again with better lighting.",
    "unclear_image": "The photo is too blurry or dark to judge. Try again closer up with better lighting.",
    "multiple_items": "We found more than one food item. Take a photo of just one item.",
    "server_error": "Something went wrong on our end. Please try again in a moment.",
}


def error_response(error_type: str, message: Optional[str] = None) -> dict:
    if error_type not in ERROR_TYPES:
        error_type = "server_error"
    return ErrorResponse(
        error_type=error_type, message=message or ERROR_MESSAGES[error_type]
    ).model_dump()


def label_for_score(score: int) -> str:
    if score <= 30:
        return "fresh"
    if score <= 60:
        return "use_soon"
    if score <= 85:
        return "use_now"
    return "compost"


MOCK_SUCCESS = {
    "status": "success",
    "item": {"name": "banana", "category": "fruit"},
    "freshness": {
        "score": 65,
        "label": "use_now",
        "confidence": "high",
        "estimated_days_left": 1,
    },
    "analysis": {
        "visual_signs": ["brown spots across most of the peel", "soft near the stem"],
        "summary": "Past peak ripeness but still good to cook with.",
    },
    "recommendation": {
        "action": "cook",
        "tips": ["Perfect for banana bread", "Peel and freeze for smoothies"],
    },
    "impact": {"co2_saved_kg": 0.08, "money_saved_usd": 0.25},
}
