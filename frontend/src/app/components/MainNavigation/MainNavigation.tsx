"use client";

import { Form, NavLink, useRouteLoaderData } from "react-router-dom";
import classes from "./MainNavigation.module.css";
import NewsletterSignup from "../NewsletterSignup/NewsletterSignup";

const MainNavigation = (): JSX.Element => {
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
					{!token && (
						<li>
							<NavLink
								className={({ isActive }) =>
									isActive ? classes.active : undefined
								}
								to="/auth?mode=login"
							>
								Authentication
							</NavLink>
						</li>
					)}
					{token !== null && (
						<li>
							<Form action="/logout" method="post">
								<button>Logout</button>
							</Form>
						</li>
					)}
				</ul>
			</nav>
			<NewsletterSignup />
		</header>
	);
};

export default MainNavigation;
