"use client";

import {
	Link,
	SubmitFunction,
	useRouteLoaderData,
	useSubmit,
} from "react-router-dom";
import { EventType } from "../../../shared/types";
import classes from "./EventItem.module.css";

const EventItem = ({ event }: { event: EventType }): JSX.Element => {
	const submit: SubmitFunction = useSubmit();
	const token = useRouteLoaderData("root");

	const startDeleteHandler = (): void => {
		const proceed: boolean = window.confirm(
			"Are you sure you want to delete?"
		);

		if (proceed) {
			submit(null, { method: "delete" }); // (data that we want to submit, todo)
		}
	};

	return (
		<article className={classes.event}>
			<img src={event.image} alt={event.title} />
			<h1>{event.title}</h1>
			<time>{event.date}</time>
			<p>{event.description}</p>
			{token === null && (
				<menu className={classes.actions}>
					<Link to="edit">Edit</Link>
					<button onClick={startDeleteHandler}>Delete</button>
				</menu>
			)}
		</article>
	);
};

export default EventItem;
