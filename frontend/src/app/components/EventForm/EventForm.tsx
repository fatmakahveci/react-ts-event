"use client";
import { useState } from "react";

import ImagePicker from "../ImagePicker/ImagePicker";

export default function EventForm({ inputData, onSubmit, children }: { inputData: any, onSubmit: any, children: any }) {
	const [selectedImage, setSelectedImage] = useState(inputData?.image);

	function handleSelectImage(image: any) {
		setSelectedImage(image);
	}

	function handleSubmit(event: any) {
		event.preventDefault();

		const formData = new FormData(event.target);
		const data = Object.fromEntries(formData);

		onSubmit({ ...data, image: selectedImage });
	}

	return (
		<form id="event-form" onSubmit={handleSubmit}>
			<p className="control">
				<label htmlFor="title">Title</label>
				<input
					type="text"
					id="title"
					name="title"
					defaultValue={inputData?.title ?? ""}
				/>
			</p>

			<div className="control">
				<ImagePicker
					images={[]}
					onSelect={handleSelectImage}
					selectedImage={selectedImage}
				/>
			</div>

			<p className="control">
				<label htmlFor="description">Description</label>
				<textarea
					id="description"
					name="description"
					defaultValue={inputData?.description ?? ""}
				/>
			</p>

			<div className="controls-row">
				<p className="control">
					<label htmlFor="date">Date</label>
					<input
						type="date"
						id="date"
						name="date"
						defaultValue={inputData?.date ?? ""}
					/>
				</p>

				<p className="control">
					<label htmlFor="time">Time</label>
					<input
						type="time"
						id="time"
						name="time"
						defaultValue={inputData?.time ?? ""}
					/>
				</p>
			</div>

			<p className="control">
				<label htmlFor="location">Location</label>
				<input
					type="text"
					id="location"
					name="location"
					defaultValue={inputData?.location ?? ""}
				/>
			</p>

			<p className="form-actions">{children}</p>
		</form>
	);
}

// import {
// 	Form,
// 	LoaderFunctionArgs,
// 	NavigateFunction,
// 	Navigation,
// 	json,
// 	redirect,
// 	useNavigate,
// 	useNavigation,
// } from "react-router-dom";
// import { EventType } from "../../../shared/types";
// import classes from "./EventForm.module.css";

// const EventForm = ({
// 	method,
// 	event,
// }: {
// 	method: any;
// 	event: EventType;
// }): JSX.Element => {
// 	const navigate: NavigateFunction = useNavigate();
// 	const navigation: Navigation = useNavigation();

// 	const isSubmitting: boolean = navigation.state === "submitting";

// 	const cancelHandler = (): void => {
// 		navigate("..");
// 	};

// 	return (
// 		<Form method={method} className={classes.form}>
// 			<p>
// 				<label htmlFor="title">Title</label>
// 				<input
// 					id="title"
// 					type="text"
// 					name="title"
// 					required
// 					defaultValue={event ? event.title : ""}
// 				/>
// 			</p>
// 			<p>
// 				<label htmlFor="image">Image</label>
// 				<input
// 					id="image"
// 					type="url"
// 					name="image"
// 					required
// 					defaultValue={event ? event.image : ""}
// 				/>
// 			</p>
// 			<p>
// 				<label htmlFor="date">Date</label>
// 				<input
// 					id="date"
// 					type="date"
// 					name="date"
// 					required
// 					defaultValue={event ? event.date : ""}
// 				/>
// 			</p>
// 			<p>
// 				<label htmlFor="description">Description</label>
// 				<textarea
// 					id="description"
// 					name="description"
// 					required
// 					defaultValue={event ? event.description : ""}
// 				/>
// 			</p>
// 			<div className={classes.actions}>
// 				<button
// 					type="button"
// 					onClick={cancelHandler}
// 					disabled={isSubmitting}
// 				>
// 					Cancel
// 				</button>
// 				<button disabled={isSubmitting}>
// 					{isSubmitting ? "Submitting..." : "Save"}
// 				</button>
// 			</div>
// 		</Form>
// 	);
// };

// export default EventForm;

// export const action = async ({ request, params }: LoaderFunctionArgs) => {
// 	const method: string = request.method;
// 	const data: FormData = await request.formData();

// 	const eventData = {
// 		title: data.get("title"),
// 		image: data.get("image"),
// 		date: data.get("date"),
// 		description: data.get("description"),
// 	};

// 	let url: string = "http://localhost:8080/events";

// 	if (method === "PATCH") {
// 		const eventId: string | undefined = params.eventId;
// 		url += "/" + eventId;
// 	}

// 	const response: Response = await fetch(url, {
// 		method: method,
// 		headers: {
// 			"Content-Type": "application/json",
// 		},
// 		body: JSON.stringify(eventData),
// 	});

// 	if (response.status === 422) {
// 		return response;
// 	}

// 	if (!response.ok) {
// 		throw json({ message: "Could not save event." }, { status: 500 });
// 	}

// 	return redirect("/events");
// };
