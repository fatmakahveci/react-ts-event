import { beforeEach, expect, test, vi } from "vitest";

import { action } from "./AuthPage";
import { clearSession, getSession } from "../lib/session";
const session = () => ({ user: { id: "owner", email: "owner@example.com" }, expiresAt: Date.now() + 3600000 });

const createRequest = (mode: string, email = "person@example.com") =>
  new Request(`http://localhost/auth?mode=${mode}`, {
    method: "POST",
    body: new URLSearchParams({ email, password: "secret123" }),
  });

beforeEach(() => {
  localStorage.clear();
  clearSession();
  vi.restoreAllMocks();
});

test("rejects unsupported authentication modes", async () => {
  await expect(action({ request: createRequest("reset") })).rejects.toMatchObject({
    init: { status: 422 },
  });
});

test("passes API validation responses back to the route", async () => {
  const validationResponse = new Response(JSON.stringify({ message: "Invalid credentials" }), {
    status: 422,
  });
  vi.spyOn(globalThis, "fetch").mockResolvedValue(validationResponse);

  await expect(action({ request: createRequest("login") })).resolves.toBe(validationResponse);
});

test("keeps session metadata in memory and redirects home", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify(session()), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  );

  const response = (await action({ request: createRequest("signup") })) as Response;

  expect(response.status).toBe(302);
  expect(response.headers.get("Location")).toBe("/");
  expect(localStorage.getItem("token")).toBeNull();
  expect(getSession()?.user.id).toBe("owner");
  expect(localStorage.getItem("expiration")).toBeNull();
  expect(fetch).toHaveBeenCalledWith(
    "http://localhost:8080/signup",
    expect.objectContaining({ method: "POST" })
  );
});

test("turns unexpected API failures into route errors", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 503 }));

  await expect(action({ request: createRequest("login") })).rejects.toMatchObject({
    init: { status: 503 },
  });
});

test("returns to the requested page after login and ignores external redirects", async () => {
  vi.spyOn(globalThis, "fetch").mockImplementation(async () => new Response(JSON.stringify(session())));
  for (const [target, expected] of [["/events/new", "/events/new"], ["//evil.example", "/"], ["/events/..//evil.example", "/"], ["/%2e%2e//evil.example", "/"]]) {
    const request = new Request(`http://localhost/auth?mode=login&redirectTo=${encodeURIComponent(target)}`, { method: "POST", body: new URLSearchParams({ email: "reader@example.com", password: "secret123" }) });
    const result = await action({ request }) as Response;
    expect(result.headers.get("Location")).toBe(expected);
  }
});
