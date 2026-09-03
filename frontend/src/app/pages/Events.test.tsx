import { expect, test, vi } from "vitest";

import { loader } from "./Events";

test("loads the event collection", async () => {
  const events = [{ id: "event-1", title: "React Summit" }];
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify({ events }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  );

  const result = await loader();
  await expect(result.events).resolves.toEqual(events);
});

test("throws a route response when event loading fails", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 500 }));
  const result = await loader();
  await expect(result.events).rejects.toMatchObject({ status: 500 });
});
