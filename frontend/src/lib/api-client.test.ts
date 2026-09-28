import { apiRequest, readJson } from "./api-client";
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
