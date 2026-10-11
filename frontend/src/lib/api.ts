import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { API_BASE_URL, USE_MOCK, MOCK_SCENARIO, TIMEOUT_MS, FORCE_ERROR } from "./config";
import successMock from "../mocks/success";
import errorMocks from "../mocks/errors";
import type { AnalyzeResult, ErrorResult } from "./types";
import { File } from "expo-file-system";
import { fetch as expoFetch } from "expo/fetch";

const serverError = (message: string): ErrorResult => ({
  status: "error",
  error_type: "server_error",
  message,
});

// Shrinks the photo so the upload stays under about 1 MB.
// If anything goes wrong, falls back to the original photo.
export async function compressImage(uri: string): Promise<string> {
  try {
    const ctx = ImageManipulator.manipulate(uri);
    ctx.resize({ width: 1024 });
    const image = await ctx.renderAsync();
    const out = await image.saveAsync({ compress: 0.7, format: SaveFormat.JPEG });
    return out.uri;
  } catch (e) {
    return uri;
  }
}

// Always RETURNS one of the two contract shapes. Never throws.
// Check result.status first: "success" or "error".
export async function analyzePhoto(uri: string): Promise<AnalyzeResult> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 1500)); // so you can see the spinner
    if (MOCK_SCENARIO === "success") return successMock;
    return errorMocks[MOCK_SCENARIO] || serverError("Unknown mock scenario.");
  }

  const small = await compressImage(uri);
  const form = new FormData();
  // Field name must be "image". Do NOT set a Content-Type header yourself.
 form.append("image", new File(small));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const query = FORCE_ERROR ? `?mock=${FORCE_ERROR}` : "";const res = await expoFetch(`${API_BASE_URL}/analyze${query}`, {
    
      method: "POST",
      body: form,
      signal: controller.signal,
    });
    const data = await res.json();
    if (data && data.status === "success" && data.freshness && data.item) return data;
    if (data && data.status === "error" && data.error_type) return data;
    return serverError("We got an unexpected answer from the server. Try again.");
    } catch (e) {
    console.log("ANALYZE FAILED:", e);
    return serverError("Couldn't reach the server. Check your connection and try again.");
  } finally {
    clearTimeout(timer);
  }
}

// GET /health -> {"ok": true}
export async function checkHealth(): Promise<boolean> {
  if (USE_MOCK) return true;
  try {
    const res = await fetch(`${API_BASE_URL}/health`);
    const data = await res.json();
    return data && data.ok === true;
  } catch (e) {
    return false;
  }
}
