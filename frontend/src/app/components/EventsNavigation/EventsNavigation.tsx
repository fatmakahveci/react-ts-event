"use client";

import { NavLink, useRouteLoaderData } from "react-router-dom";
import classes from "./EventsNavigation.module.css";

const EventsNavigation = (): JSX.Element => {
	const token = useRouteLoaderData("root");

	return (
		<header className={classes.header}>
			<nav>
				<ul className={classes.list}>
					<li>
						<NavLink
							className={({ isActive }) =>
								isActive ? classes.active : undefined
							}
							to="/events"
							end
						>
							All Events
						</NavLink>
					</li>
					{token === null && (
						<li>
							<NavLink
								className={({ isActive }) =>
									isActive ? classes.active : undefined
								}
								to="/events/new"
							>
								New Event
							</NavLink>
						</li>
					)}
				</ul>
			</nav>
		</header>
	);
};

export default EventsNavigation;
