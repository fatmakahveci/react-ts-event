"use client";

import classes from "./MainNavigation.module.css";

const MainNavigation = (): JSX.Element => {
	return (
		<header className={classes.header}>
			<nav>
				<ul className={classes.list}>
					<li>
						<a>Home</a>
					</li>
					<li>
						<a>Events</a>
					</li>
				</ul>
			</nav>
		</header>
	);
};

export default MainNavigation;
