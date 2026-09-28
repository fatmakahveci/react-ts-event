import { data } from "react-router-dom";
import { apiRequest, readJson, responseError } from "../../../lib/api-client";
import type { EventRecord } from "../types";

export async function loadEvents(signal?: AbortSignal) {
  const response = await apiRequest("/events", signal ? { signal } : undefined);
  if (!response.ok) throw await responseError(response, "Could not fetch events.");
  const body = await readJson<{ events: EventRecord[] }>(response);
  if (!Array.isArray(body.events)) throw data({ message: "The event list is unavailable." }, { status: 502 });
  return body.events;
}
export async function loadEvent(id: string, signal?: AbortSignal) {
  const response = await apiRequest(`/events/${encodeURIComponent(id)}`, signal ? { signal } : undefined);
  if (!response.ok) throw await responseError(response, "Could not fetch details for selected event.");
  return (await readJson<{ event: EventRecord }>(response)).event;
}
