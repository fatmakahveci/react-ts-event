"use client";

import classes from "./EventsNavigation.module.css";

const EventsNavigation = (): JSX.Element => {
	return (
		<header className={classes.header}>
			<nav>
				<ul className={classes.list}>
					<li>
						<a href="/events">All Events</a>
					</li>
					<li>
						<a href="/events/new">New Event</a>
					</li>
				</ul>
			</nav>
		</header>
	);
};

export default EventsNavigation;
