// Mirrors the locked API contract in the team brief. Do not change without all four people agreeing.
export type Category = "fruit" | "vegetable" | "bread" | "other";
export type Label = "fresh" | "use_soon" | "use_now" | "compost";
export type Confidence = "high" | "medium" | "low";
export type Action = "eat" | "cook" | "store" | "compost";
export type ErrorType = "not_food" | "unclear_image" | "multiple_items" | "server_error";

export interface SuccessResult {
  status: "success";
  item: { name: string; category: Category };
  freshness: {
    score: number; // 0 = perfectly fresh, 100 = spoiled
    label: Label;
    confidence: Confidence;
    estimated_days_left: number | null;
  };
  analysis: { visual_signs: string[]; summary: string };
  recommendation: { action: Action; tips: string[] };
  impact: { co2_saved_kg: number; money_saved_usd: number };
}

export interface ErrorResult {
  status: "error";
  error_type: ErrorType;
  message: string;
}

export type AnalyzeResult = SuccessResult | ErrorResult;
