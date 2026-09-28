import { apiRequest, readJson, responseError } from "./api-client";
import { loadEvent, loadEvents } from "../features/events/lib/events-api";

test("reports offline failures and propagates aborts", async () => {
  vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("offline"));
  await expect(apiRequest("/events")).rejects.toMatchObject({ init: { status: 503 } });
  const controller = new AbortController(); controller.abort();
  const aborted = new DOMException("Aborted", "AbortError");
  vi.mocked(fetch).mockRejectedValue(aborted);
  await expect(apiRequest("/events", { signal: controller.signal })).rejects.toBe(aborted);
});
test("keeps missing-event status and rejects malformed responses", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ message: "Not found" }), { status: 404 }));
  await expect(loadEvent("missing")).rejects.toMatchObject({ init: { status: 404 } });
  await expect(readJson(new Response("not JSON"))).rejects.toMatchObject({ init: { status: 502 } });
  vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ events: null })));
  await expect(loadEvents()).rejects.toMatchObject({ init: { status: 502 } });
});

test("sends cookie and CSRF protection on writes without mutating caller headers", async () => {
  const original = new Headers({ "Content-Type": "application/json" });
  const fetch = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}"));
  for (const method of ["POST", "PATCH", "DELETE"]) {
    await apiRequest("/events", { method, headers: original });
    const options = fetch.mock.calls.at(-1)![1]!;
    expect(options.credentials).toBe("include");
    expect(options.redirect).toBe("error");
    expect(options.cache).toBe("no-store");
    expect(new Headers(options.headers).get("X-Gather-CSRF")).toBe("1");
    expect(new Headers(options.headers).get("Content-Type")).toBe("application/json");
  }
  expect(original.has("X-Gather-CSRF")).toBe(false);
});

test("does not require a CSRF preflight header for read-only requests", async () => {
  const fetch = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}"));
  await apiRequest("/events");
  const options = fetch.mock.calls[0][1]!;
  expect(options.credentials).toBe("include");
  expect(new Headers(options.headers).has("X-Gather-CSRF")).toBe(false);
});

test("retains server field errors and request IDs and handles non-JSON failures", async () => {
  const response = new Response(JSON.stringify({ message: "Check the title", errors: { title: "Required" }, requestId: "request-123" }), { status: 422 });
  await expect(responseError(response, "Save failed")).resolves.toMatchObject({
    data: { message: "Check the title", errors: { title: "Required" }, requestId: "request-123" }, init: { status: 422 },
  });
  await expect(responseError(new Response("Bad Gateway", { status: 502 }), "Save failed"))
    .resolves.toMatchObject({ data: { message: "Save failed" }, init: { status: 502 } });
});
