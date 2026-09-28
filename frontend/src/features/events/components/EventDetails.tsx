import { useState } from "react";
import { Link, useNavigation, useRouteLoaderData, useSubmit } from "react-router-dom";
import type { EventRecord } from "../types";
import { getSessionUserId } from "../../auth/lib/session";
import { formatDate } from "../lib/dates";
import EventImage from "../../../components/ui/EventImage";
import Icon from "../../../components/ui/Icon";
import classes from "./EventDetails.module.css";

export default function EventDetails({ event }: { event: EventRecord }) {
  const submit = useSubmit();
  const session = useRouteLoaderData("root");
  const pending = useNavigation().state !== "idle";
  const [confirm, setConfirm] = useState(false);
  const [shareStatus, setShareStatus] = useState("");
  const [shareLink, setShareLink] = useState("");
  const owner = !!session && !!event.ownerId && event.ownerId === getSessionUserId();
  async function share() {
    const url = new URL(`/events/${event.id}`, window.location.origin).href;
    try { await navigator.clipboard.writeText(url); setShareStatus("Event link copied."); setShareLink(""); }
    catch { setShareLink(url); setShareStatus("Copy the event link below."); }
  }
  return <article className={classes.event}>
    <Link className={classes.back} to="/events">← Back to events</Link>
    <EventImage src={event.image} alt={event.title} loading="eager" />
    <div className={classes.body}>
      <div><span className="eyebrow">AN EXPERIENCE WORTH SHARING</span><h1>{event.title}</h1><h2 className={classes.about}>About this event</h2><p className={classes.description}>{event.description}</p></div>
      <aside className={classes.info} aria-label="Event date and actions"><span className={classes.calendar}><Icon name="calendar" width="24" height="24" /></span><span className="eyebrow">MARK YOUR CALENDAR</span><time dateTime={event.date}>{formatDate(event.date)}</time><p>Good plans are better together.</p>
        <div className={classes.actions}><button className="text-button" onClick={share}>Share event<Icon name="arrow" /></button>{owner && <><Link className="button text-button" to="edit">Edit</Link><button className={classes.danger} disabled={pending} onClick={() => setConfirm(true)}>Delete</button></>}</div>
      </aside>
    </div>
    {shareStatus && <p role="status">{shareStatus}</p>}
    {shareLink && <input aria-label="Event link" readOnly value={shareLink} onFocus={e => e.target.select()} />}
    {confirm && <section className="confirmation" aria-label="Confirm event deletion"><h2>Delete this event?</h2><p>This will permanently remove {event.title}.</p><div className={classes.actions}><button autoFocus className="text-button" disabled={pending} onClick={() => setConfirm(false)}>Keep event</button><button className={classes.danger} disabled={pending} onClick={() => submit(null, { method: "delete" })}>{pending ? "Deleting…" : "Confirm delete"}</button></div></section>}
  </article>;
}
