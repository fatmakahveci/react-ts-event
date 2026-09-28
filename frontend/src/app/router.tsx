import { createBrowserRouter } from "react-router-dom";
import { action as manipulateEventAction } from "../features/events/components/EventForm";
import AuthPage, {
	action as authAction,
} from "../features/auth/pages/AuthPage";
import EditEventPage from "../features/events/pages/EditEventPage";
import ErrorPage from "../pages/ErrorPage";
import EventDetailsPage, {
	action as deleteEventAction,
	loader as eventDetailLoader,
} from "../features/events/pages/EventDetailsPage";
import EventsPage, { loader as eventsLoader } from "../features/events/pages/EventsPage";
import EventsLayout from "../features/events/layouts/EventsLayout";
import HomePage from "../pages/HomePage";
import { action as logoutAction } from "../features/auth/actions/logout";
import NewEventPage from "../features/events/pages/NewEventPage";
import NewsletterPage, { action as newsletterAction } from "../features/newsletter/pages/NewsletterPage";
import RootLayout from "./layouts/RootLayout";
import { checkAuthLoader, sessionLoader } from "../features/auth/lib/session";

export const router = createBrowserRouter([
	{
		path: "/",
		element: <RootLayout />,
		errorElement: <ErrorPage />,
        hydrateFallbackElement: <p role="status">Loading Gather…</p>,
		id: "root",
        // TODO: Skip this check for event-filter-only navigation; slow responses currently drop typed characters.
		loader: sessionLoader,
		children: [
			{ index: true, element: <HomePage /> },
			{
				path: "events",
				element: <EventsLayout />,
				children: [
					{
						index: true,
						element: <EventsPage />,
						loader: eventsLoader,
                        shouldRevalidate: ({ currentUrl, nextUrl, defaultShouldRevalidate, formMethod }) => !formMethod && currentUrl.pathname === nextUrl.pathname && currentUrl.search !== nextUrl.search ? false : defaultShouldRevalidate,
					},
					{
						path: ":eventId",
						id: "event-detail",
						loader: eventDetailLoader,
						children: [
							{
								index: true,
								element: <EventDetailsPage />,
								action: deleteEventAction,
							},
							{
								path: "edit",
								element: <EditEventPage />,
								action: manipulateEventAction,
								loader: checkAuthLoader,
							},
						],
					},
					{
						path: "new",
						element: <NewEventPage />,
						action: manipulateEventAction,
						loader: checkAuthLoader,
					},
				],
			},
			{
				path: "auth",
				element: <AuthPage />,
				action: authAction,
			},
			{
				path: "newsletter",
				element: <NewsletterPage />,
				action: newsletterAction,
			},
			{
				path: "logout",
				action: logoutAction,
			},
		],
	},
]);
