"""Impact lookup table. Owned by Backend 2.

CO2 values: kg CO2e per kg of food, from Our World in Data (Poore & Nemecek 2018)
weight_kg: rough average weight of one item
price_usd: rough price of one item (double-check against H-E-B prices)
"""

FOOD_IMPACT = {
    "banana":     {"co2_per_kg": 0.86, "weight_kg": 0.12, "price_usd": 0.25},
    "apple":      {"co2_per_kg": 0.43, "weight_kg": 0.18, "price_usd": 0.75},
    "tomato":     {"co2_per_kg": 2.09, "weight_kg": 0.15, "price_usd": 0.50},
    "strawberry": {"co2_per_kg": 1.53, "weight_kg": 0.45, "price_usd": 3.00},
    "avocado":    {"co2_per_kg": 1.05, "weight_kg": 0.17, "price_usd": 1.00},
    "bread":      {"co2_per_kg": 1.57, "weight_kg": 0.45, "price_usd": 2.50},
    "lettuce":    {"co2_per_kg": 0.53, "weight_kg": 0.50, "price_usd": 1.50},
}


def find_food(item_name):
    name = item_name.lower()
    for food in FOOD_IMPACT:
        if food in name:
            return food
    return None


def impact_for(name: str, action: str) -> dict:
    """The contract's impact object: zeros for compost or foods not in the table."""
    food = find_food(name)
    if food is None or action == "compost":
        return {"co2_saved_kg": 0.0, "money_saved_usd": 0.0}
    data = FOOD_IMPACT[food]
    return {
        "co2_saved_kg": round(data["weight_kg"] * data["co2_per_kg"], 3),
        "money_saved_usd": round(data["price_usd"], 2),
    }
