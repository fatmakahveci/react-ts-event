"use client";

import { useEffect, useState } from "react";
import { EventType } from "../../shared/types";
import EventsList from "../components/EventsList/EventsList";

const EventsPage = (): JSX.Element => {
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [fetchedEvents, setFetchedEvents] = useState<EventType[]>([]);
	const [error, setError] = useState<string>("");

	useEffect(() => {
		const fetchEvents = async () => {
			setIsLoading(true);
			const response = await fetch("http://localhost:8080/events");

			if (!response.ok) {
				setError("Fetching events failed.");
			} else {
				const resData = await response.json();
				setFetchedEvents(resData.events);
			}

			setIsLoading(false);
		};
		fetchEvents();
	}, []);

	return (
		<>
			<div style={{ textAlign: "center" }}>
				{isLoading && <p>Loading...</p>}
				{error && <p>{error}</p>}
			</div>
			{!isLoading && fetchedEvents && (
				<EventsList events={fetchedEvents}/>
			)}
		</>
	);
};
export default EventsPage;
