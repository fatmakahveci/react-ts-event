"use client";

import { Link } from "react-router-dom";
import { EventTypeProps } from "../../../shared/types";
import classes from "./EventItem.module.css";

const EventItem = (event: EventTypeProps): JSX.Element => {
	const startDeleteHandler = () => {
		// ...
	};

	return (
		<article className={classes.event}>
			<img src={event.event.image} alt={event.event.title} />
			<h1>{event.event.title}</h1>
			<time>{event.event.date}</time>
			<p>{event.event.description}</p>
			<menu className={classes.actions}>
				<Link to="edit">Edit</Link>
				<button onClick={startDeleteHandler}>Delete</button>
			</menu>
		</article>
	);
};

export default EventItem;
