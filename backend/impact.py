"""Impact lookup table: rough CO2 (kg) and money (USD) saved per typical item. Owned by Backend 2.

Placeholder numbers; replace with researched values.
"""

IMPACT_TABLE = {
    "banana": {"co2_saved_kg": 0.08, "money_saved_usd": 0.25},
    "avocado": {"co2_saved_kg": 0.20, "money_saved_usd": 1.50},
    "apple": {"co2_saved_kg": 0.05, "money_saved_usd": 0.60},
    "strawberries": {"co2_saved_kg": 0.30, "money_saved_usd": 4.00},
    "tomato": {"co2_saved_kg": 0.15, "money_saved_usd": 0.50},
    "bread": {"co2_saved_kg": 0.60, "money_saved_usd": 3.00},
    "leafy greens": {"co2_saved_kg": 0.20, "money_saved_usd": 2.50},
}

DEFAULT_IMPACT = {"co2_saved_kg": 0.10, "money_saved_usd": 0.50}

ALIASES = {
    "strawberry": "strawberries",
    "tomatoes": "tomato",
    "bananas": "banana",
    "apples": "apple",
    "avocados": "avocado",
    "lettuce": "leafy greens",
    "spinach": "leafy greens",
    "kale": "leafy greens",
}


def impact_for(name: str, action: str) -> dict:
    if action == "compost":
        return {"co2_saved_kg": 0.0, "money_saved_usd": 0.0}
    key = name.strip().lower()
    key = ALIASES.get(key, key)
    return dict(IMPACT_TABLE.get(key, DEFAULT_IMPACT))
