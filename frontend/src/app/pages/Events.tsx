"use client";

import { useLoaderData } from "react-router-dom";
import EventsList from "../components/EventsList/EventsList";
import { EventType } from "../../shared/types";

type LoaderData = {
	events: EventType[];
};

const EventsPage = (): JSX.Element => {
	const data = useLoaderData() as LoaderData;
	return <EventsList events={data.events} />;
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
