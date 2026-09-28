import { beforeEach, expect, test, vi } from "vitest";
import { action } from "./logout";
import { clearSession, getSession, rememberSession, SESSION_CHANGE_KEY } from "../lib/session";
beforeEach(() => {
  clearSession(); localStorage.clear();
  rememberSession({ user: { id: "owner", email: "owner@example.com" }, expiresAt: Date.now() + 3600000 });
});
test("revokes the server session before clearing metadata and redirecting", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 204 }));
  const response = await action();
  expect(getSession()).toBeNull();
  expect(localStorage.getItem(SESSION_CHANGE_KEY)).not.toBeNull();
  expect(response.headers.get("Location")).toBe("/");
  expect(fetch).toHaveBeenCalledWith("http://localhost:8080/logout", expect.objectContaining({ method: "POST", credentials: "include" }));
  const headers = vi.mocked(fetch).mock.calls[0][1]?.headers as Headers;
  expect(headers.get("X-Gather-CSRF")).toBe("1");
});
test("does not falsely report logout when server revocation fails", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 500 }));
  await expect(action()).rejects.toMatchObject({ init: { status: 500 } });
  expect(getSession()).not.toBeNull();
  expect(localStorage.getItem(SESSION_CHANGE_KEY)).toBeNull();
});
