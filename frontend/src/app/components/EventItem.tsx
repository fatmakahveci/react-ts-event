"use client";

import { FC } from "react";
import { EventType } from "../../shared/types";
import classes from "./EventItem.module.css";

const EventItem: FC<EventType> = ({ date, description, image, title }): JSX.Element => {
	const startDeleteHandler = () => {
		// ...
	};

	return (
		<article className={classes.event}>
			<img src={image} alt={title} />
			<h1>{title}</h1>
			<time>{date}</time>
			<p>{description}</p>
			<menu className={classes.actions}>
				<a href="edit">Edit</a>
				<button onClick={startDeleteHandler}>Delete</button>
			</menu>
		</article>
	);
};

export default EventItem;
