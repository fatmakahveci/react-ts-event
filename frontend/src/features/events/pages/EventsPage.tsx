import { Suspense } from "react";
import { Await, useLoaderData, type LoaderFunctionArgs } from "react-router-dom";
import EventList from "../components/EventList";
import { loadEvents } from "../lib/events-api";
import type { EventRecord } from "../types";

export default function EventsPage() {
  const { events } = useLoaderData() as { events: Promise<EventRecord[]> };
  return <Suspense fallback={<p role="status">Loading events…</p>}><Await resolve={events}>{loaded => <EventList events={loaded} />}</Await></Suspense>;
}
export async function loader(args?: LoaderFunctionArgs) { return { events: loadEvents(args?.request.signal) }; }
