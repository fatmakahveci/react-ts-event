import { beforeEach, afterEach, expect, test, vi } from "vitest";
import { checkAuthLoader, clearSession, getSession, getSessionUserId, notifySessionChange, rememberSession, safeReturnTo, sessionLoader, SESSION_CHANGE_KEY } from "./session";
const session = () => ({ user: { id: "owner-1", email: "owner@example.com" }, expiresAt: Date.now() + 3600000 });
beforeEach(() => { vi.useRealTimers(); localStorage.clear(); clearSession(); });
afterEach(() => { vi.useRealTimers(); });

test("loads the server session and keeps credentials out of browser storage", async () => {
  localStorage.setItem("token", "legacy-token");
  localStorage.setItem("expiration", "2999-01-01");
  const expected = session();
  vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify(expected)));
  expect(await sessionLoader()).toEqual(expected);
  expect(getSessionUserId()).toBe("owner-1");
  expect(localStorage.getItem("token")).toBeNull();
  expect(localStorage.getItem("expiration")).toBeNull();
  expect(fetch).toHaveBeenCalledWith("http://localhost:8080/session", expect.objectContaining({ credentials: "include", cache: "no-store" }));
});
test("does not trust legacy tokens and redirects rejected sessions", async () => {
  localStorage.setItem("token", "forged-token");
  localStorage.setItem("expiration", "2999-01-01");
  expect(getSession()).toBeNull();
  vi.spyOn(globalThis, "fetch").mockImplementation(async () => new Response(null, { status: 401 }));
  expect(await sessionLoader()).toBeNull();
  const response = await checkAuthLoader() as Response;
  expect(response.headers.get("Location")).toBe("/auth?mode=login");
  expect(getSessionUserId()).toBeNull();
});
test("allows authenticated routes after server validation", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify(session())));
  expect(await checkAuthLoader()).toBeNull();
});
test("expires cached display metadata without a persistent credential", () => {
  vi.useFakeTimers();
  rememberSession(session());
  vi.advanceTimersByTime(3600001);
  expect(getSession()).toBeNull();
  expect(getSessionUserId()).toBeNull();
});
test("rejects malformed and expired session responses", () => {
  for (const value of [{}, { user: {} }, { ...session(), expiresAt: 1 }, { ...session(), expiresAt: NaN }]) {
    expect(() => rememberSession(value as ReturnType<typeof session>)).toThrow();
  }
});
test("reports session service failures instead of treating them as logout", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 503 }));
  await expect(sessionLoader()).rejects.toMatchObject({ init: { status: 503 } });
});
test("preserves internal return paths and blocks external redirects", async () => {
  expect(safeReturnTo("/events/new?draft=1")).toBe("/events/new?draft=1");
  for (const path of ["https://evil.example", "//evil.example", "/\\evil.example", "/auth", "/logout", null]) expect(safeReturnTo(path)).toBe("/");
  vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 401 }));
  const response = await checkAuthLoader({ request: new Request("http://localhost/events/new") }) as Response;
  expect(response.headers.get("Location")).toBe("/auth?mode=login&redirectTo=%2Fevents%2Fnew");
});
test("broadcasts only an opaque change notification and tolerates blocked storage", () => {
  rememberSession(session());
  notifySessionChange();
  expect(localStorage.getItem(SESSION_CHANGE_KEY)).not.toContain("owner");
  vi.spyOn(localStorage, "removeItem").mockImplementation(() => { throw new Error("blocked"); });
  vi.spyOn(localStorage, "setItem").mockImplementation(() => { throw new Error("blocked"); });
  expect(() => { rememberSession(session()); notifySessionChange(); clearSession(); }).not.toThrow();
  expect(getSession()).toBeNull();
});
