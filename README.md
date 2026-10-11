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

Base URL (local): `http://localhost:8000`
Interactive docs: `http://localhost:8000/docs`

> Calling from a phone? `localhost` won't work. Use the laptop's IP (e.g. `http://192.168.x.x:8000`) or the deployed URL once it's up.

---

### POST /scan
Analyzes a photo of a single fruit or veggie and returns a freshness score.

**Request:** `multipart/form-data` with the image under the field name `file`

**Response:**
```json
{
  "item": "banana",
  "observations": ["bright yellow peel", "no brown spots"],
  "freshness_score": 10,
  "days_left": 5,
  "action": "eat_now",
  "rescue_idea": "eat fresh or slice over oatmeal",
  "confidence": "high"
}
```

- `freshness_score`: 0 to 100 (higher = less fresh)
  - 0–30 fresh · 31–60 eat soon · 61–85 cook or freeze · 86–100 compost
- `action`: one of `eat_now`, `cook`, `freeze`, `compost`
- `confidence`: one of `high`, `medium`, `low`

**Example (React Native / Expo):**
```js
const formData = new FormData();
formData.append("file", {
  uri: photoUri,
  name: "food.jpg",
  type: "image/jpeg",
});

const res = await fetch(`${BASE_URL}/scan`, {
  method: "POST",
  body: formData,
});
const result = await res.json();
```

---

### POST /impact
Call this after `/scan` to log a rescued item and get savings.

**Request:** JSON
```json
{ "item": "banana", "action": "eat_now" }
```
Pass `item` and `action` straight from the `/scan` response.

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
  body: JSON.stringify({ item: result.item, action: result.action }),
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