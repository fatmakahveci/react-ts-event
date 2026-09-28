import { getSessionUserId } from "../../auth/lib/session";
import { Link, useRouteLoaderData } from "react-router-dom";
import EventForm from "../components/EventForm";
import type { EventRecord } from "../types";

export default function EditEventPage() {
  const { event } = useRouteLoaderData("event-detail") as { event: EventRecord };
  if (!event.ownerId || event.ownerId !== getSessionUserId()) return <section><h1>Only the organizer can edit this event</h1><Link to={`/events/${event.id}`}>Back to event</Link></section>;
  return <EventForm method="patch" event={event} />;
}
