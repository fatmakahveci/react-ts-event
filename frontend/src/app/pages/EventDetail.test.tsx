import { beforeEach, expect, test, vi } from "vitest";

import { action, loader } from "./EventDetail";

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("token", "signed-token");
  localStorage.setItem("expiration", "2999-01-01T00:00:00.000Z");
  vi.restoreAllMocks();
});

const routeArgs = (request: Request) =>
  ({
    request,
    params: { eventId: "event-1" },
    context: undefined,
  }) as unknown as Parameters<typeof loader>[0];

test("loads selected event details and the event collection", async () => {
  const event = { id: "event-1", title: "React Summit" };
  const events = [event];
  vi.spyOn(globalThis, "fetch")
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ event }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    )
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ events }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

  const result = await loader(
    routeArgs(new Request("http://localhost/events/event-1"))
  );

  expect(result.event).toEqual(event);
  await expect(result.events).resolves.toEqual(events);
});

test("sends authenticated deletes and redirects to the collection", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 200 }));

  const response = (await action(
    routeArgs(
      new Request("http://localhost/events/event-1", { method: "DELETE" })
    )
  )) as Response;

  expect(fetch).toHaveBeenCalledWith(
    "http://localhost:8080/events/event-1",
    expect.objectContaining({
      method: "DELETE",
      headers: { Authorization: "Bearer signed-token" },
    })
  );
  expect(response.headers.get("Location")).toBe("/events");
});

test("throws a route response when deletion fails", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 500 }));

  await expect(
    action(
      routeArgs(
        new Request("http://localhost/events/event-1", { method: "DELETE" })
      )
    )
  ).rejects.toMatchObject({ init: { status: 500 } });
});
