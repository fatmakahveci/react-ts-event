import { useEffect } from "react";
import { Link, isRouteErrorResponse, useRouteError } from "react-router-dom";
import MainNavigation from "../components/layout/MainNavigation";
import PageContent from "../components/ui/PageContent";

export default function ErrorPage() {
  const error = useRouteError();
  const status = isRouteErrorResponse(error) ? error.status : 500;
  const detail = isRouteErrorResponse(error) && typeof error.data === "object" ? error.data : {};
  const title = status === 404 ? "This page could not be found" : status === 403 ? "This event belongs to another organizer" : status === 503 ? "Connection interrupted" : "Something went wrong";
  const message = typeof detail?.message === "string" ? detail.message : "Please try again or return to the event collection.";
  useEffect(() => { document.title = `${title} · Gather`; }, [title]);
  return <><MainNavigation /><main id="main-content"><PageContent title={title}><p role="alert">{message}</p><div className="recovery-actions"><button onClick={() => window.location.reload()}>Try again</button><Link to="/events">Explore events</Link><Link to="/">Go home</Link></div>{detail?.requestId && <small>Reference: {detail.requestId}</small>}</PageContent></main></>;
}
