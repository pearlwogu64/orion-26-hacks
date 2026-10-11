import type { SuccessResult } from "../lib/types";

const success: SuccessResult = {
  status: "success",
  item: { name: "banana", category: "fruit" },
  freshness: { score: 65, label: "use_now", confidence: "high", estimated_days_left: 1 },
  analysis: {
    visual_signs: ["brown spots across most of the peel", "soft near the stem"],
    summary: "Past peak ripeness but still good to cook with.",
  },
  recommendation: {
    action: "cook",
    tips: ["Perfect for banana bread", "Peel and freeze for smoothies"],
  },
  impact: { co2_saved_kg: 0.08, money_saved_usd: 0.25 },
};

export default success;
