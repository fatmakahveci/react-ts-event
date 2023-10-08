"use client";

import { Suspense } from "react";
import type { LoaderFunctionArgs } from "react-router-dom";
import {
	Await,
	defer,
	json,
	redirect,
	useRouteLoaderData,
} from "react-router-dom";
import { EventType } from "../../shared/types";
import EventItem from "../components/EventItem/EventItem";
import EventsList from "../components/EventsList/EventsList";

type LoaderData = {
	event: EventType;
	events: EventType[];
};

const EventDetailPage = (): JSX.Element => {
	const { event, events } = useRouteLoaderData("event-detail") as LoaderData;
	return (
		<>
			<Suspense
				fallback={<p style={{ textAlign: "center" }}>Loading...</p>}
			>
				<Await resolve={event}>
					{(loadedEvent) => <EventItem event={loadedEvent} />}
				</Await>
			</Suspense>
			<Suspense
				fallback={<p style={{ textAlign: "center" }}>Loading...</p>}
			>
				<Await resolve={events}>
					{(loadedEvents) => <EventsList events={loadedEvents} />}
				</Await>
			</Suspense>
		</>
	);
};

export default EventDetailPage;

const loadEvent = async (id: string): Promise<Response> => {
	const response = await fetch("http://localhost:8080/events/" + id);

	if (!response.ok) {
		throw json(
			{ message: "Could not fetch details for selected event." },
			{
				status: 500,
			}
		);
	} else {
		const resData = await response.json();
		return resData.event;
	}
};

const loadEvents = async (): Promise<Response> => {
	const response: Response = await fetch("http://localhost:8080/events");

	if (!response.ok) {
		throw json(
			{ message: "Could not fetch events." },
			{
				status: 500,
			}
		);
	} else {
		const resData = await response.json();
		return resData.events;
	}
};

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
	const eventId: any = params.eventId;

	return defer({
		event: await loadEvent(eventId),
		events: loadEvents(),
	});
};

export const action = async ({ request, params }: LoaderFunctionArgs) => {
	const eventId: string | undefined = params.eventId;
	const response: Response = await fetch(
		"http://localhost:8080/events/" + eventId,
		{ method: request.method }
	);

	if (!response.ok) {
		throw json(
			{ message: "Could not delete the event." },
			{
				status: 500,
			}
		);
	} else {
		return redirect("/events");
	}
};
