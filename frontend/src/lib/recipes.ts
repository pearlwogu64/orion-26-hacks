// Calls the backend's POST /recipes endpoint for Rescue Kitchen.
import { API_BASE_URL } from "./config";
import type { SuccessResult } from "./types";

export interface Recipe {
  title: string;
  time_minutes: number;
  difficulty: "easy" | "medium" | "hard";
  description: string;
  ingredients: string[];
  steps: string[];
  image_url?: string | null;
}

export interface Hack {
  title: string;
  description: string;
  steps: string[];
}

export interface RecipesResult {
  recipes: Recipe[];
  hacks: Hack[];
}

export async function getRecipes(result: SuccessResult): Promise<RecipesResult | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(`${API_BASE_URL}/recipes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        name: result.item.name,
        category: result.item.category,
        label: result.freshness.label,
        score: result.freshness.score,
        days_left: result.freshness.estimated_days_left,
      }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
