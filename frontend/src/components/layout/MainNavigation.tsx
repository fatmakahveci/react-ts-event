import { Form, Link, NavLink, useRouteLoaderData } from "react-router-dom";
import classes from "./MainNavigation.module.css";

export default function MainNavigation() {
  const authenticated = !!useRouteLoaderData("root");
  return <header className={classes.header}>
    <Link to="/" className={classes.brand} aria-label="Gather home">Gather<span className="brand-dot">.</span></Link>
    <nav aria-label="Main navigation"><ul className={classes.list}>
      <li><NavLink to="/" end className={({isActive}) => isActive ? classes.active : undefined}>Home</NavLink></li>
      <li><NavLink to="/events" className={({isActive}) => isActive ? classes.active : undefined}>Explore events</NavLink></li>
      <li><NavLink to="/newsletter">Newsletter</NavLink></li>
      <li>{authenticated ? <Form action="/logout" method="post"><button className={classes.account}>Log out</button></Form> : <NavLink className={classes.account} to="/auth?mode=login">Log in <span aria-hidden="true">↗</span></NavLink>}</li>
    </ul></nav>
  </header>;
}
