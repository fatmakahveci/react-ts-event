"use client";

import {
	useRouteLoaderData
} from "react-router-dom";
import EventForm from "../components/EventForm/EventForm";

const EditEventPage = (): JSX.Element => {
	const data: any = useRouteLoaderData("event-detail");
	return <EventForm method="patch" event={data.event} />;
};

export default EditEventPage;
