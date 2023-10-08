"use client";

import { Link } from "react-router-dom";
import { EventType } from "../../../shared/types";
import classes from "./EventsList.module.css";

const EventsList = ({events}: { events: EventType[]}) : JSX.Element => {
	if (!Array.isArray(events)) {
		return <div>No events to display</div>;
	}

	return (
		<div className={classes.events}>
			<h1>All Events</h1>
			<ul className={classes.list}>
				{events.map((event: EventType) => (
					<li key={event.id} className={classes.item}>
						<Link to={`/events/${event.id}`}>
							<img src={event.image} alt={event.title} />
							<div className={classes.content}>
								<h2>{event.title}</h2>
								<time>{event.date}</time>
							</div>
						</Link>
					</li>
				))}
			</ul>
		</div>
	);
};

export default EventsList;
