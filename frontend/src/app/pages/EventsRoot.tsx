"use client";

import { Outlet } from "react-router-dom";
import EventsNavigation from "../components/EventsNavigation/EventsNavigation";

const EventsRootLayout = (): JSX.Element => {
	return (
		<>
			<EventsNavigation />
			<Outlet />
		</>
	);
};
export default EventsRootLayout;
