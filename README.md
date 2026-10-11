# Ripe 🍓

Ripe is a food-waste app for fruits and veggies that tells you how fresh a piece of produce is before it goes bad. Snap a photo of a single fruit or veggie and Ripe identifies it, estimates how fresh it is, and tells you how many days it has left. A model trained on fruits and vegetables across rot stages, from fresh to inedible, handles the freshness estimate. Ripe then tells you what to do with it (eat it now, cook it, freeze it, or compost it) and suggests a recipe to use it up, so less ends up in the trash and more ends up on your plate.

**MVP 🏆**
- Photo Upload
- Item Recognition (Gemini API)
- Freshness / Rot-Stage Classifier
- Action Recommendation (eat now / cook / freeze / compost)
- Recipe Suggestions (use-it-up first)

**Stretch Goals 🌟**
- Expiration Push Notifications
- Waste Tracker (money + CO₂ saved)

**Tech Stack 💻**
IDE: VSCode
Emulator: Expo Go
Wireframe: Figma

- Frontend: React Native (via Expo)
- Backend API: FastAPI (Python)
- Image Parsing: Gemini API
- Freshness Model: TensorFlow / Keras (transfer learning on MobileNetV2)
- Dataset: Kaggle "Fruits Fresh and Rotten" dataset
- Database: Supabase (PostgreSQL)
- Recipes: Gemini API (or Spoonacular API)

**Helpful Resources/Tutorials 🔎**
- React Native: Expo Setup, Image Picker in Expo, Fetching Data from an API in React Native
- FastAPI: Installing FastAPI (virtual environments!), File Uploads in FastAPI
- Gemini: Gemini API Quickstart (Python), Gemini Vision / Image Input
- ML: TensorFlow Transfer Learning Tutorial, Image Classification with Keras
- Testing: Postman Tutorial

**Team 👥**
- Frontend 1: Eman
- Frontend 2: Farwa
- Backend 1: Pearl
- Backend 2: Prakhya

## Backend API

Base URL (deployed): `https://orion-26-hacks.onrender.com`
Base URL (local): `http://localhost:8000`
Interactive docs: add `/docs` to either URL

> The free Render server sleeps after ~15 min idle; the first request can take 30–60 s. Hit `/health` first to wake it.

### GET /health
Returns `{"ok": true}` when the server is up.

---

### POST /analyze
Scores how fresh one food item is from a photo. Checks freshness, not foodborne illness.

**Request:** `multipart/form-data`, image under the field name `image` (keep it under ~1 MB; max 5 MB)

**Response (success):**
```json
{
  "status": "success",
  "item": { "name": "banana", "category": "fruit" },
  "freshness": { "score": 65, "label": "use_now", "confidence": "high", "estimated_days_left": 1 },
  "analysis": {
    "visual_signs": ["brown spots across most of the peel", "soft near the stem"],
    "summary": "Past peak ripeness but still good to cook with."
  },
  "recommendation": { "action": "cook", "tips": ["Perfect for banana bread", "Peel and freeze for smoothies"] },
  "impact": { "co2_saved_kg": 0.08, "money_saved_usd": 0.25 }
}
```

**Response (error):**
```json
{ "status": "error", "error_type": "not_food", "message": "We couldn't spot a food item in this photo. Try again with better lighting." }
```

- Always check `status` first. Errors usually come back as HTTP 200, so don't rely on the status code.
- `score`: 0 (perfectly fresh) to 100 (spoiled)
- `label`: `fresh` (0–30), `use_soon` (31–60), `use_now` (61–85), `compost` (86–100). Computed by the backend from the score, so they always match.
- `category`: `fruit`, `vegetable`, `bread`, `other`
- `confidence`: `high`, `medium`, `low`
- `estimated_days_left`: integer or `null` (always `null` for compost)
- `visual_signs`: 1–4 phrases · `tips`: 0–3 tips
- `action`: `eat`, `cook`, `store`, `compost`
- `impact`: from our lookup table, not Gemini. `0` for compost or foods not in the table.
- `error_type`: `not_food`, `unclear_image`, `multiple_items`, `server_error`

**Testing error screens:** add `?mock=<error_type>` (for example `/analyze?mock=not_food`) to force that error.

---

### POST /recipes
Gets 3 recipes and 2 shelf-life hacks for a scanned item. Call it with values from the `/analyze` response.

**Request:** JSON
```json
{ "name": "banana", "category": "fruit", "label": "use_now", "score": 70, "days_left": 1 }
```

**Response:**
```json
{
  "recipes": [
    {
      "title": "Banana Pancakes",
      "time_minutes": 10,
      "difficulty": "easy",
      "description": "Soft bananas mash easily into a quick batter.",
      "ingredients": ["1 ripe banana", "2 eggs"],
      "steps": ["Mash the banana.", "Whisk in the eggs.", "Cook on a hot pan."],
      "image_query": "banana pancakes",
      "image_url": "https://..."
    }
  ],
  "hacks": [
    { "title": "Wrap the stems", "description": "Slows ripening.", "steps": ["Separate the bunch.", "Wrap each stem."] }
  ]
}
```

- `difficulty`: `easy`, `medium`, `hard`
- `image_url` can be `null`. Photos come from Unsplash if `UNSPLASH_ACCESS_KEY` is set, otherwise from TheMealDB.
- Returns HTTP 502 if recipes can't be generated.

---

### POST /impact
Call this after `/analyze` to log a rescued item and get savings.

**Request:** JSON
```json
{ "item": "banana", "action": "eat" }
```
Pass `item.name` and `recommendation.action` straight from the `/analyze` response.

**Response (rescued):**
```json
{
  "rescued": true,
  "food": "banana",
  "kg_saved": 0.12,
  "co2_saved_kg": 0.103,
  "money_saved_usd": 0.25,
  "totals": {
    "kg_saved": 0.12,
    "co2_saved": 0.103,
    "money_saved": 0.25,
    "items_saved": 1
  }
}
```

**Response (not rescued, compost or unknown food):**
```json
{ "rescued": false, "message": "..." }
```

**Example:**
```js
const res = await fetch(`${BASE_URL}/impact`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ item: result.item.name, action: result.recommendation.action }),
});
const impact = await res.json();
```

---

### GET /impact/totals
Returns running totals for the impact counter.

```json
{ "kg_saved": 0.36, "co2_saved": 0.31, "money_saved": 0.75, "items_saved": 3 }
```

Totals reset when the server restarts.

---

### Impact data source
CO2 values are kg CO2e per kg of food from Our World in Data (Poore & Nemecek, 2018, *Science*). Weights and prices are per-item estimates.