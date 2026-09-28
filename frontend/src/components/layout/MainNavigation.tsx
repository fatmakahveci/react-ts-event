import { useEffect, useRef, useState } from "react";
import { Form, Link, NavLink, useLocation, useRouteLoaderData } from "react-router-dom";
import Icon from "../ui/Icon";
import classes from "./MainNavigation.module.css";

export default function MainNavigation() {
  const authenticated = !!useRouteLoaderData("root");
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const location = useLocation();
  useEffect(() => setOpen(false), [location.key]);
  return <header className={classes.header} onKeyDown={event => {
    if (event.key === "Escape" && open) {
      setOpen(false);
      toggle.current?.focus();
    }
  }}>
    <Link to="/" className={classes.brand} aria-label="Gather home">Gather<span className="brand-dot">.</span></Link>
    <button ref={toggle} className={classes.menuToggle} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="main-navigation" onClick={() => setOpen(!open)}><Icon name={open ? "close" : "menu"} />Menu</button>
    <nav id="main-navigation" className={classes.navigation} data-open={open} aria-label="Main navigation" onClick={() => setOpen(false)}><ul className={classes.list}>
      <li><NavLink to="/" end className={({isActive}) => isActive ? classes.active : undefined}>Home</NavLink></li>
      <li><NavLink to="/events" className={({isActive}) => isActive ? classes.active : undefined}>Explore events</NavLink></li>
      <li><NavLink to="/newsletter" className={({isActive}) => isActive ? classes.active : undefined}>Newsletter</NavLink></li>
      <li>{authenticated ? <Form action="/logout" method="post"><button className={classes.account}>Log out</button></Form> : <NavLink className={classes.account} to="/auth?mode=login">Log in <Icon name="arrow" /></NavLink>}</li>
    </ul></nav>
  </header>;
}
