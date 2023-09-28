"use client";

import { useRouteLoaderData } from "react-router-dom";
import { EventType } from "../../shared/types";
import EventForm from "../components/EventForm/EventForm";

type LoaderData = {
	event: EventType;
};

const EditEventPage = (): JSX.Element => {
	const data = useRouteLoaderData("event-detail") as LoaderData;
	return <EventForm event={data.event} />;
};

export default EditEventPage;
