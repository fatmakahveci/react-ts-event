"use client";

import {
	Form,
	LoaderFunctionArgs,
	NavigateFunction,
	Navigation,
	json,
	redirect,
	useNavigate,
	useNavigation,
} from "react-router-dom";
import { EventType } from "../../../shared/types";
import classes from "./EventForm.module.css";

const EventForm = ({
	method,
	event,
}: {
	method: any;
	event: EventType;
}): JSX.Element => {
	const navigate: NavigateFunction = useNavigate();
	const navigation: Navigation = useNavigation();

	const isSubmitting: boolean = navigation.state === "submitting";

	const cancelHandler = (): void => {
		navigate("..");
	};

	return (
		<Form method={method} className={classes.form}>
			<p>
				<label htmlFor="title">Title</label>
				<input
					id="title"
					type="text"
					name="title"
					required
					defaultValue={event ? event.title : ""}
				/>
			</p>
			<p>
				<label htmlFor="image">Image</label>
				<input
					id="image"
					type="url"
					name="image"
					required
					defaultValue={event ? event.image : ""}
				/>
			</p>
			<p>
				<label htmlFor="date">Date</label>
				<input
					id="date"
					type="date"
					name="date"
					required
					defaultValue={event ? event.date : ""}
				/>
			</p>
			<p>
				<label htmlFor="description">Description</label>
				<textarea
					id="description"
					name="description"
					required
					defaultValue={event ? event.description : ""}
				/>
			</p>
			<div className={classes.actions}>
				<button
					type="button"
					onClick={cancelHandler}
					disabled={isSubmitting}
				>
					Cancel
				</button>
				<button disabled={isSubmitting}>
					{isSubmitting ? "Submitting..." : "Save"}
				</button>
			</div>
		</Form>
	);
};

export default EventForm;

export const action = async ({ request, params }: LoaderFunctionArgs) => {
	const method: string = request.method;
	const data: FormData = await request.formData();

	const eventData = {
		title: data.get("title"),
		image: data.get("image"),
		date: data.get("date"),
		description: data.get("description"),
	};

	let url: string = "http://localhost:8080/events";

	if (method === "PATCH") {
		const eventId: string | undefined = params.eventId;
		url += "/" + eventId;
	}

	const response: Response = await fetch(url, {
		method: method,
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(eventData),
	});

	if (response.status === 422) {
		return response;
	}

	if (!response.ok) {
		throw json({ message: "Could not save event." }, { status: 500 });
	}

	return redirect("/events");
};
