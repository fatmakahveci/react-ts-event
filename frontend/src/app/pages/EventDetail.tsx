"use client";

import type { LoaderFunctionArgs } from "react-router-dom";
import { json, useRouteLoaderData } from "react-router-dom";
import { EventType } from "../../shared/types";
import EventItem from "../components/EventItem/EventItem";

type LoaderData = {
	event: EventType;
};
const EventDetailPage = (): JSX.Element => {
	const data = useRouteLoaderData("event-detail") as LoaderData;
	return <EventItem event={data.event} />;
};
export default EventDetailPage;

export async function loader({ params }: LoaderFunctionArgs) {
	const id: string | undefined = params.eventId;
	const response: Response = await fetch(
		"http://localhost:8080/events/" + id
	);

	if (!response.ok) {
		throw json(
			{ message: "Could not fetch details for selected event." },
			{
				status: 500,
			}
		);
	} else {
		return response;
	}
}
