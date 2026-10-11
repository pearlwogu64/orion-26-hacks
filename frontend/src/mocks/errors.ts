import type { ErrorResult } from "../lib/types";

// One fake error per error_type in the contract.
const errors: Record<string, ErrorResult> = {
  not_food: {
    status: "error",
    error_type: "not_food",
    message: "We couldn't spot a food item in this photo. Try again with better lighting.",
  },
  unclear_image: {
    status: "error",
    error_type: "unclear_image",
    message: "That photo is too blurry to read. Hold steady and try again.",
  },
  multiple_items: {
    status: "error",
    error_type: "multiple_items",
    message: "We see several foods. Photograph one item at a time.",
  },
  server_error: {
    status: "error",
    error_type: "server_error",
    message: "Something went wrong on our end. Please try again.",
  },
};

export default errors;
