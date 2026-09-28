import { Suspense } from "react";
import { Await, redirect, useRouteLoaderData, type LoaderFunctionArgs } from "react-router-dom";
import EventDetails from "../components/EventDetails";
import EventList from "../components/EventList";
import { getSession, clearSession, loginRedirect } from "../../auth/lib/session";
import { loadEvent, loadEvents } from "../lib/events-api";
import { apiRequest, responseError } from "../../../lib/api-client";
import type { EventRecord } from "../types";

export default function EventDetailsPage() {
  const { event, events } = useRouteLoaderData("event-detail") as { event: EventRecord; events: Promise<EventRecord[]> };
  return <><EventDetails event={event} /><Suspense fallback={<p role="status">Loading more events…</p>}><Await resolve={events}>{loaded => <EventList events={loaded.filter((item: EventRecord) => item.id !== event.id)} related />}</Await></Suspense></>;
}
export async function loader({ params, request }: LoaderFunctionArgs) {
  return { event: await loadEvent(params.eventId!, request.signal), events: loadEvents(request.signal) };
}
export async function action({ request, params }: LoaderFunctionArgs) {
  if (!getSession()) return redirect(loginRedirect(`/events/${params.eventId}`));
  const response = await apiRequest(`/events/${encodeURIComponent(params.eventId!)}`, { method: "DELETE", signal: request.signal });
  if (response.status === 401) { clearSession(); return redirect(loginRedirect(`/events/${params.eventId}`)); }
  if (!response.ok) throw await responseError(response, "Could not delete the event.");
  return redirect("/events");
}
