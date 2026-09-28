import { useEffect } from "react";
import { Outlet, ScrollRestoration, useLoaderData, useLocation, useMatches, useNavigation, useRevalidator, useSubmit } from "react-router-dom";
import MainNavigation from "../../components/layout/MainNavigation";
import { SESSION_CHANGE_KEY, type Session } from "../../features/auth/lib/session";

export default function RootLayout() {
  const session = useLoaderData() as Session | null;
  const submit = useSubmit();
  const navigation = useNavigation();
  const { revalidate } = useRevalidator();
  const { pathname } = useLocation();
  const matches = useMatches();
  const detail = matches.find(match => match.id === "event-detail")?.data as { event?: { title: string } } | undefined;
  const eventTitle = detail?.event?.title;
  useEffect(() => {
    if (!session) return;
    const timer = setTimeout(() => submit(null, { action: "/logout", method: "post" }), Math.max(0, Math.min(session.expiresAt - Date.now(), 2_147_483_647)));
    return () => clearTimeout(timer);
  }, [session, submit]);
  useEffect(() => {
    const sync = (event: StorageEvent) => { if (!event.key || event.key === SESSION_CHANGE_KEY) void revalidate(); };
    // TODO: Keep transient session-check failures from unmounting a form with unsaved changes.
    const focus = () => { void revalidate(); };
    window.addEventListener("storage", sync);
    window.addEventListener("focus", focus);
    return () => { window.removeEventListener("storage", sync); window.removeEventListener("focus", focus); };
  }, [revalidate]);
  useEffect(() => {
    const title = pathname.endsWith("/edit") ? "Edit event" : pathname === "/events/new" ? "Create an event" : eventTitle || ({ "/": "Experiences worth sharing", "/events": "Explore events", "/auth": "Your account", "/newsletter": "Newsletter" }[pathname] || "Gather");
    document.title = `${title} · Gather`;
  }, [pathname, eventTitle]);
  return <>
    <a className="skip-link" href="#main-content">Skip to content</a><MainNavigation />
    {navigation.state !== "idle" && <div className="navigation-status" role="status">{navigation.state === "submitting" ? "Saving…" : "Loading…"}</div>}
    <main id="main-content" aria-busy={navigation.state !== "idle"}><Outlet /></main>
    <footer className="site-footer"><span>Gather<span className="brand-dot">.</span></span><p>Good people. Shared experiences. Lasting connections.</p><small>Made for your community.</small></footer>
    <ScrollRestoration />
  </>;
}
