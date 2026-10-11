# Ripe 🍓

Ripe is a food-waste app for fruits and veggies that tells you which produce in your fridge will spoil first, before it does. Snap a photo of your grocery receipt or your fridge, and Ripe picks out your produce, estimates how fresh each item is, and ranks everything by how soon it’ll go bad. A model trained on fruits and vegetables across rot stages, from fresh to inedible, handles the freshness estimate. Ripe then suggests recipes that use up your at-risk produce first, so less ends up in the trash and more ends up on your plate.

**MVP 🏆**
- Photo Upload (receipt + fridge)
- Item Recognition (Gemini API)
- Freshness / Rot-Stage Classifier
- Spoil-First Ranking
- Recipe Suggestions (use-it-up first)
- Fridge Inventory View

**Stretch Goals 🌟**
- Expiration Push Notifications
- Waste Tracker (money + CO₂ saved)
- Shopping List Based on Habits
- H-E-B Integration (pitch angle: receipts, deals, local sourcing)
- Future Implementation: Household Sharing (shared fridge for roommates/families)

**Tech Stack 💻**
IDE: VSCode
Emulator: Expo Go
Wireframe: Figma

- Frontend: React Native (via Expo)
- Backend API: FastAPI (Python)
- Image + Receipt Parsing: Gemini API
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

