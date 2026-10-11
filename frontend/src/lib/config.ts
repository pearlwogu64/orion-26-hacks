// Frontend 1 owns this file.

// true  = no server needed, uses the mock data in src/mocks (default until the backend URL is ready)
// false = calls the real backend at API_BASE_URL
export const USE_MOCK = false;

// When USE_MOCK is true, pick what the fake server returns:
// "success" | "not_food" | "unclear_image" | "multiple_items" | "server_error"
export const MOCK_SCENARIO: string = "success";

// Get this from Backend 1 (Render/Railway URL). No trailing slash. NOT localhost.
export const API_BASE_URL = "http://192.168.20.91:8000";
// Free hosting can take a while to wake up, so be generous.
export const TIMEOUT_MS = 10000;

export const DISCLAIMER = "Checks freshness, not foodborne illness";
// "" = normal. Or "not_food" | "unclear_image" | "multiple_items" | "server_error" to force an error from the real server.
export const FORCE_ERROR: string = "";
