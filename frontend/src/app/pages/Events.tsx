"use client";

import { useLoaderData } from "react-router-dom";
import { EventType } from "../../shared/types";
import EventsList from "../components/EventsList/EventsList";

const EventsPage = (): JSX.Element => {
	const data: any = useLoaderData();
	const events: EventType[] = data.events;

	return <EventsList events={events} />;
};

export default EventsPage;

export const loader = async () => {
	const response: Response = await fetch("http://localhost:8080/events");

	if (!response.ok) {
		throw new Response(
			JSON.stringify({ message: "Could not fetch events." }),
			{
				status: 500,
			}
		);
	} else {
		return response;
	}
};
