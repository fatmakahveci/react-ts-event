import { beforeEach, expect, test, vi } from "vitest";

import { action } from "./Authentication";

const createRequest = (mode: string, email = "person@example.com") =>
  new Request(`http://localhost/auth?mode=${mode}`, {
    method: "POST",
    body: new URLSearchParams({ email, password: "secret123" }),
  });

beforeEach(() => {
  localStorage.clear();
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

test("stores successful authentication details and redirects home", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify({ token: "signed-token" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  );

  const response = (await action({ request: createRequest("signup") })) as Response;

  expect(response.status).toBe(302);
  expect(response.headers.get("Location")).toBe("/");
  expect(localStorage.getItem("token")).toBe("signed-token");
  expect(localStorage.getItem("expiration")).not.toBeNull();
  expect(fetch).toHaveBeenCalledWith(
    "http://localhost:8080/signup",
    expect.objectContaining({ method: "POST" })
  );
});

test("turns unexpected API failures into route errors", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 503 }));

  await expect(action({ request: createRequest("login") })).rejects.toMatchObject({
    init: { status: 500 },
  });
});
