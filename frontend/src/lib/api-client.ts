import { data } from "react-router-dom";
import { API_URL } from "./api-config";

export async function apiRequest(path: string, options?: RequestInit): Promise<Response> {
  const headers = new Headers(options?.headers);
  // Cookie authentication and the API's CSRF header must travel together on unsafe requests.
  if (!["GET", "HEAD"].includes((options?.method || "GET").toUpperCase())) headers.set("X-Gather-CSRF", "1");
  try {
    return await fetch(`${API_URL}${path}`, { ...options, headers, credentials: "include", cache: "no-store", redirect: "error" });
  } catch (error) {
    // Route changes cancel obsolete requests; cancellation is not a connection failure.
    if (options?.signal?.aborted) throw error;
    throw data({ message: "Cannot reach the server. Check your connection and try again." }, { status: 503 });
  }
}
export async function responseError(response: Response, fallback: string) {
  const body = await response.json().catch(() => ({}));
  return data({ message: typeof body.message === "string" ? body.message : fallback, errors: body.errors, requestId: body.requestId }, { status: response.status });
}
export async function readJson<T>(response: Response): Promise<T> {
  try { return await response.json() as T; }
  catch { throw data({ message: "The server returned an unreadable response. Please try again." }, { status: 502 }); }
}
