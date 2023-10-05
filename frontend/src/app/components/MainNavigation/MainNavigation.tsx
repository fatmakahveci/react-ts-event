"use client";

import { NavLink } from "react-router-dom";
import classes from "./MainNavigation.module.css";

const MainNavigation = (): JSX.Element => {
	return (
		<header className={classes.header}>
			<nav>
				<ul className={classes.list}>
					<li>
						<NavLink
							className={({ isActive }) =>
								isActive ? classes.active : undefined
							}
							to="/"
							end
						>
							Home
						</NavLink>
					</li>
					<li>
						<NavLink
							className={({ isActive }) =>
								isActive ? classes.active : undefined
							}
							to="/events"
						>
							Events
						</NavLink>
					</li>
					<li>
						<NavLink
							className={({ isActive }) =>
								isActive ? classes.active : undefined
							}
							to="/newsletter"
						>
							Newsletter
						</NavLink>
					</li>
				</ul>
			</nav>
		</header>
	);
};

export default MainNavigation;
