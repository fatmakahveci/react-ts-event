"use client";

import { Params, useParams } from "react-router-dom";

const EventDetailPage = (): JSX.Element => {
	const params: Params<string> = useParams();

	return (
		<>
			<h1>EventDetailPage</h1>
			<p>Event ID: {params.eventId}</p>
		</>
	);
};
export default EventDetailPage;
