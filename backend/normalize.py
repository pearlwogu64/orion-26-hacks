"""Turn Gemini's raw JSON (the format asked for in prompt.py) into a contract-valid response.

Small mistakes (out-of-range score, too many tips, unknown category) are repaired;
anything unusable raises ValueError so the caller returns a server_error.
"""

from contract import (
    ACTIONS,
    CATEGORIES,
    CONFIDENCES,
    SuccessResponse,
    error_response,
    label_for_score,
)
from impact import impact_for

DEFAULT_ACTION_FOR_LABEL = {
    "fresh": "eat",
    "use_soon": "eat",
    "use_now": "cook",
    "compost": "compost",
}

DEFAULT_SUMMARY_FOR_LABEL = {
    "fresh": "Looks fresh.",
    "use_soon": "Still good, but use it soon.",
    "use_now": "Past its peak, best used today.",
    "compost": "Too far gone to eat.",
}

GEMINI_PROBLEMS = ("not_food", "unclear_image", "multiple_items")


def _clean_strings(value, max_items: int) -> list[str]:
    if not isinstance(value, list):
        return []
    strings = [str(v).strip() for v in value if str(v).strip()]
    return strings[:max_items]


def normalize(raw: dict) -> dict:
    problem = raw.get("problem")
    if problem in GEMINI_PROBLEMS:
        return error_response(problem)

    name = str(raw.get("item") or "").strip().lower()
    if not name:
        raise ValueError("missing item")
    category = raw.get("category")
    if category not in CATEGORIES:
        category = "other"

    try:
        score = int(round(float(raw["freshness_score"])))
    except (KeyError, TypeError, ValueError):
        raise ValueError("missing or non-numeric freshness_score")
    score = max(0, min(100, score))
    label = label_for_score(score)

    confidence = raw.get("confidence")
    if confidence not in CONFIDENCES:
        confidence = "low"

    days_left = raw.get("days_left")
    try:
        days_left = max(0, int(days_left)) if days_left is not None else None
    except (TypeError, ValueError):
        days_left = None
    if label == "compost":
        days_left = None

    visual_signs = _clean_strings(raw.get("observations"), 4)
    if not visual_signs:
        raise ValueError("no observations")
    summary = str(raw.get("summary") or "").strip() or DEFAULT_SUMMARY_FOR_LABEL[label]

    action = raw.get("action")
    if label == "compost":
        action = "compost"
    elif action not in ACTIONS or action == "compost":
        action = DEFAULT_ACTION_FOR_LABEL[label]
    tips = _clean_strings(raw.get("tips"), 3)

    response = SuccessResponse(
        item={"name": name, "category": category},
        freshness={
            "score": score,
            "label": label,
            "confidence": confidence,
            "estimated_days_left": days_left,
        },
        analysis={"visual_signs": visual_signs, "summary": summary},
        recommendation={"action": action, "tips": tips},
        impact=impact_for(name, action),
    )
    return response.model_dump()
