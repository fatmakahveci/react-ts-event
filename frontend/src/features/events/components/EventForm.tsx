import { useCallback, useEffect, useRef, useState } from "react";
import { Form, Link, data, redirect, useActionData, useBeforeUnload, useBlocker, useNavigation, type ActionFunctionArgs } from "react-router-dom";
import type { EventRecord } from "../types";
import { apiRequest, responseError } from "../../../lib/api-client";
import { getSession, clearSession, loginRedirect } from "../../auth/lib/session";
import Icon from "../../../components/ui/Icon";
import classes from "./EventForm.module.css";

type FormErrors = { message?: string; errors?: Record<string, string> };
export default function EventForm({ method, event }: { method: "post" | "patch"; event?: EventRecord }) {
  const result = useActionData() as FormErrors | undefined;
  const navigation = useNavigation();
  const pending = navigation.state !== "idle";
  const [dirty, setDirty] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && !pending && currentLocation.pathname !== nextLocation.pathname);
  useBeforeUnload(useCallback((e: BeforeUnloadEvent) => { if (dirty && !pending) { e.preventDefault(); e.returnValue = ""; } }, [dirty, pending]));
  useEffect(() => {
    if (result?.errors) {
      const key = Object.keys(result.errors)[0];
      const input = formRef.current?.elements.namedItem(key);
      if (input instanceof HTMLElement) input.focus();
    }
  }, [result]);
  function errorProps(key: string) { return { "aria-invalid": !!result?.errors?.[key], "aria-describedby": result?.errors?.[key] ? `${key}-error` : undefined }; }
  function error(key: string) { return result?.errors?.[key] && <span className="field-error" id={`${key}-error`}>{result.errors[key]}</span>; }
  return <>
    <div className={classes.layout}>
    <Form ref={formRef} method={method} className={classes.form} onChange={() => setDirty(true)}>
      <span className="eyebrow">BRING PEOPLE TOGETHER</span><h1>{event ? "Edit your event" : "Create an event"}</h1><p className={classes.intro}>Give your community something to look forward to.</p><p className={classes.required}>All fields are required. You can edit the details later.</p>
      {result && <div role="alert" className="form-error"><p>{result.message}</p></div>}
      <p><label htmlFor="title">Event title</label><input id="title" name="title" required maxLength={160} defaultValue={event?.title} placeholder="A great experience starts with a name" {...errorProps("title")} />{error("title")}</p>
      <p><label htmlFor="image">Cover image URL</label><input id="image" name="image" type="url" required maxLength={2048} defaultValue={event?.image} placeholder="https://example.com/your-event.jpg" {...errorProps("image")} />{error("image")}</p>
      <p><label htmlFor="date">Event date</label><input id="date" name="date" type="date" required defaultValue={event?.date} {...errorProps("date")} />{error("date")}</p>
      <p><label htmlFor="description">Description</label><textarea id="description" name="description" required rows={5} maxLength={10000} defaultValue={event?.description} placeholder="What can guests expect?" {...errorProps("description")} />{error("description")}</p>
      <div className={classes.actions}><Link to={event ? `/events/${event.id}` : "/events"}>Cancel</Link><button disabled={pending}>{pending ? "Saving…" : "Save event"}<Icon name="arrow" /></button></div>
    </Form>
    <aside className={classes.tips} aria-labelledby="event-tips"><span><Icon name="calendar" /></span><h2 id="event-tips">Make people feel welcome.</h2><ol><li><strong>Give it a clear name</strong><p>Help people understand what the gathering is about at a glance.</p></li><li><strong>Set the scene</strong><p>Choose a cover image that captures the experience.</p></li><li><strong>Share the useful details</strong><p>Include the time, meeting place, and anything guests should bring.</p></li></ol></aside>
    </div>
    {blocker.state === "blocked" && <div className="confirmation" role="alertdialog" aria-modal="false" aria-labelledby="leave-title"><h2 id="leave-title">Discard your changes?</h2><p>Your event has not been saved.</p><div className={classes.actions}><button autoFocus onClick={() => blocker.reset()}>Keep editing</button><button className="text-button" onClick={() => blocker.proceed()}>Discard changes</button></div></div>}
  </>;
}
export async function action({ request, params }: ActionFunctionArgs) {
  const session = getSession();
  const login = loginRedirect(new URL(request.url).pathname);
  if (!session) return redirect(login);
  const form = await request.formData();
  const payload = Object.fromEntries(["title", "image", "date", "description"].map(key => [key, form.get(key)]));
  let response: Response;
  try {
    response = await apiRequest(`/events${request.method === "PATCH" ? `/${encodeURIComponent(params.eventId!)}` : ""}`, {
      method: request.method, signal: request.signal,
      headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    });
  } catch (error) {
    if (request.signal.aborted) throw error;
    return data({ message: "Could not connect. Your details are still here; please try again." }, { status: 503 });
  }
  if (response.status === 401) { clearSession(); return redirect(login); }
  if (!response.ok) return responseError(response, "Could not save your event. Please try again.");
  return redirect("/events");
}
