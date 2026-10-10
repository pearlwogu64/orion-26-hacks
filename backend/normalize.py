"""Turn Gemini's raw JSON into a contract-valid response.

Small mistakes (out-of-range score, too many tips, unknown category) are repaired;
anything unusable raises ValueError so the caller returns a server_error.
"""

from contract import (
    ACTIONS,
    CATEGORIES,
    CONFIDENCES,
    ERROR_TYPES,
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


def _clean_strings(value, max_items: int) -> list[str]:
    if not isinstance(value, list):
        return []
    strings = [str(v).strip() for v in value if str(v).strip()]
    return strings[:max_items]


def normalize(raw: dict) -> dict:
    if raw.get("status") == "error":
        error_type = raw.get("error_type")
        return error_response(error_type if error_type in ERROR_TYPES else "server_error")

    item = raw.get("item") or {}
    freshness = raw.get("freshness") or {}
    analysis = raw.get("analysis") or {}
    recommendation = raw.get("recommendation") or {}

    name = str(item.get("name") or "").strip().lower()
    if not name:
        raise ValueError("missing item.name")
    category = item.get("category")
    if category not in CATEGORIES:
        category = "other"

    try:
        score = int(round(float(freshness["score"])))
    except (KeyError, TypeError, ValueError):
        raise ValueError("missing or non-numeric freshness.score")
    score = max(0, min(100, score))
    label = label_for_score(score)

    confidence = freshness.get("confidence")
    if confidence not in CONFIDENCES:
        confidence = "low"

    days_left = freshness.get("estimated_days_left")
    try:
        days_left = max(0, int(days_left)) if days_left is not None else None
    except (TypeError, ValueError):
        days_left = None
    if label == "compost":
        days_left = None

    visual_signs = _clean_strings(analysis.get("visual_signs"), 4)
    if not visual_signs:
        raise ValueError("no visual_signs")
    summary = str(analysis.get("summary") or "").strip()
    if not summary:
        raise ValueError("missing summary")

    action = recommendation.get("action")
    if label == "compost":
        action = "compost"
    elif action not in ACTIONS or action == "compost":
        action = DEFAULT_ACTION_FOR_LABEL[label]
    tips = _clean_strings(recommendation.get("tips"), 3)

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
