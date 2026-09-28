import { Link, useSearchParams } from "react-router-dom";
import type { EventRecord } from "../types";
import EventImage from "../../../components/ui/EventImage";
import { useFavorites } from "../lib/favorites";
import { formatDate, localDate } from "../lib/dates";
import classes from "./EventList.module.css";

const PAGE_SIZE = 6;
export default function EventList({ events, related = false }: { events: EventRecord[]; related?: boolean }) {
  const [params, setParams] = useSearchParams();
  const { favorites, toggle, error } = useFavorites();
  const query = related ? "" : params.get("q") || "";
  const sort = params.get("sort") === "title" ? "title" : "date";
  const period = ["upcoming", "past"].includes(params.get("when") || "") ? params.get("when")! : "all";
  const savedOnly = params.get("saved") === "1";
  const today = localDate();
  const filtered = (Array.isArray(events) ? events : []).filter(event => {
    if (related) return true;
    return `${event.title} ${event.description}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())
      && (period === "all" || (period === "upcoming" ? event.date >= today : event.date < today))
      && (!savedOnly || favorites.includes(event.id));
  }).sort((a, b) => sort === "title" && !related ? a.title.localeCompare(b.title) : a.date.localeCompare(b.date));
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const requestedPage = Number(params.get("page") || 1);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? Math.min(requestedPage, pageCount) : 1;
  const visible = related ? filtered.slice(0, 3) : filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  function update(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    if (key !== "page") next.delete("page");
    setParams(next, { replace: key === "q", preventScrollReset: true });
  }
  function clear() {
    const next = new URLSearchParams(params);
    for (const key of ["q", "sort", "when", "saved", "page"]) next.delete(key);
    setParams(next, { preventScrollReset: true });
  }
  return <section className={classes.events} aria-label={related ? "More experiences" : "Event collection"}>
    <span className="eyebrow">FIND SOMETHING THAT MOVES YOU</span>
    {related ? <h2>More experiences</h2> : <><h1>All Events</h1><p className={classes.intro}>Good company is closer than you think. Find your next shared experience.</p>
      <div className={classes.toolbar}>
        <div><label htmlFor="event-search">Search events</label><input id="event-search" type="search" placeholder="Search by name or interest…" value={query} onChange={e => update("q", e.target.value)} /></div>
        <div><label htmlFor="event-sort">Sort by</label><select id="event-sort" value={sort} onChange={e => update("sort", e.target.value)}><option value="date">Event date</option><option value="title">Name A–Z</option></select></div>
        <div><label htmlFor="event-period">When</label><select id="event-period" value={period} onChange={e => update("when", e.target.value)}><option value="all">Any date</option><option value="upcoming">Upcoming</option><option value="past">Past events</option></select></div>
      </div>
      <div className={classes.filterActions}><button className="text-button" aria-pressed={savedOnly} onClick={() => update("saved", savedOnly ? "" : "1")}>{savedOnly ? "★ Saved events" : "☆ Saved events"}</button>{(query || period !== "all" || savedOnly) && <button className="text-button" onClick={clear}>Clear filters</button>}</div>
    </>}
    {error && <p role="alert">{error}</p>}
    <p className={classes.count} role="status">{filtered.length} {filtered.length === 1 ? "experience" : "experiences"} to explore</p>
    {visible.length ? <ul className={classes.list}>{visible.map(event => <li key={event.id} className={classes.item}>
      <Link to={`/events/${event.id}`}><EventImage src={event.image} alt="" loading="lazy" /><div className={classes.content}><time dateTime={event.date}>{formatDate(event.date)}</time><h2>{event.title}</h2><p>{event.description}</p><span>View experience ↗</span></div></Link>
      <button className={classes.favorite} aria-pressed={favorites.includes(event.id)} aria-label={`${favorites.includes(event.id) ? "Remove" : "Save"} ${event.title} ${favorites.includes(event.id) ? "from" : "to"} favorites`} onClick={() => toggle(event.id)}>{favorites.includes(event.id) ? "★" : "☆"}</button>
    </li>)}</ul> : <div className={classes.empty}><h2>{query || savedOnly || period !== "all" ? "No matches just yet" : "A little quiet here, for now"}</h2><p>{savedOnly ? "Save an event with the star button to find it here." : "Try another filter or create your own gathering."}</p>{query || savedOnly || period !== "all" ? <button onClick={clear}>Clear search</button> : <Link className="button" to="/events/new">Create an event</Link>}</div>}
    {!related && pageCount > 1 && <nav className={classes.pagination} aria-label="Event pages"><button disabled={page === 1} onClick={() => update("page", String(page - 1))}>Previous</button><span aria-current="page">Page {page} of {pageCount}</span><button disabled={page === pageCount} onClick={() => update("page", String(page + 1))}>Next</button></nav>}
  </section>;
}
