import { data, redirect } from "react-router-dom";
import { apiRequest, readJson, responseError } from "../../../lib/api-client";

export type Session = { user: { id: string; email: string }; expiresAt: number };
export const SESSION_CHANGE_KEY = "gather-session-change";
// This is display metadata, not proof of access. Protected API routes validate the HttpOnly cookie.
let currentSession: Session | null = null;

function removeLegacyTokens() {
  try { localStorage.removeItem("token"); localStorage.removeItem("expiration"); } catch { /* Storage is optional. */ }
}
export function notifySessionChange() {
  // A fresh marker triggers other tabs' storage listeners without storing account data or tokens.
  try { localStorage.setItem(SESSION_CHANGE_KEY, `${Date.now()}-${Math.random()}`); } catch { /* Focus revalidation still works. */ }
}
export function rememberSession(value: Session) {
  if (!value?.user || typeof value.user.id !== "string" || !value.user.id || typeof value.user.email !== "string" ||
      !Number.isFinite(value.expiresAt) || value.expiresAt <= Date.now()) {
    throw data({ message: "Invalid session response." }, { status: 502 });
  }
  removeLegacyTokens();
  currentSession = { user: { id: value.user.id, email: value.user.email }, expiresAt: value.expiresAt };
  return currentSession;
}
export function getSession() {
  return currentSession && currentSession.expiresAt > Date.now() ? currentSession : null;
}
export async function sessionLoader(args?: { request?: Request }) {
  removeLegacyTokens();
  const response = await apiRequest("/session", { signal: args?.request?.signal });
  if (response.status === 401) { clearSession(); return null; }
  if (!response.ok) throw await responseError(response, "Could not check your session.");
  return rememberSession(await readJson<Session>(response));
}
export function safeReturnTo(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || /[\\\r\n]/.test(value)) return "/";
  // Normalize against a fixed origin before accepting a post-login destination.
  const url = new URL(value, "https://gather.local");
  if (url.origin !== "https://gather.local" || ["/auth", "/logout"].includes(url.pathname)) return "/";
  return url.pathname + url.search + url.hash;
}
export function loginRedirect(path: string) {
  return `/auth?mode=login&redirectTo=${encodeURIComponent(safeReturnTo(path))}`;
}
export async function checkAuthLoader(args?: { request?: Request }) {
  const session = await sessionLoader(args);
  if (!session) {
    const url = args?.request ? new URL(args.request.url) : null;
    return redirect(url ? loginRedirect(url.pathname + url.search) : "/auth?mode=login");
  }
  return null;
}
export function getSessionUserId() { return getSession()?.user.id || null; }
export function clearSession() { currentSession = null; removeLegacyTokens(); }
