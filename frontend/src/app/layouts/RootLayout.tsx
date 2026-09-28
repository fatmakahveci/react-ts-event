import { useEffect, useState } from "react";
import { Outlet, ScrollRestoration, useLoaderData, useLocation, useMatches, useNavigation, useRevalidator, useSubmit } from "react-router-dom";
import MainNavigation from "../../components/layout/MainNavigation";
import { sessionLoader, SESSION_CHANGE_KEY, type Session } from "../../features/auth/lib/session";

export default function RootLayout() {
  const session = useLoaderData() as Session | null;
  const [sessionWarning, setSessionWarning] = useState(false);
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
    setSessionWarning(false);
    let controller: AbortController | undefined;
    const refresh = async () => {
      controller?.abort();
      const current = controller = new AbortController();
      try {
        // Check in the background first: a temporary outage must not replace an open form.
        const verified = await sessionLoader({ request: new Request(window.location.href, { signal: current.signal }) });
        if (current.signal.aborted) return;
        setSessionWarning(false);
        if (verified?.user.id !== session?.user.id || verified?.user.email !== session?.user.email || verified?.expiresAt !== session?.expiresAt) {
          void revalidate();
        }
      } catch {
        if (!current.signal.aborted) setSessionWarning(true);
      }
    };
    const sync = (event: StorageEvent) => { if (!event.key || event.key === SESSION_CHANGE_KEY) void refresh(); };
    const focus = () => { void refresh(); };
    window.addEventListener("storage", sync);
    window.addEventListener("focus", focus);
    return () => { controller?.abort(); window.removeEventListener("storage", sync); window.removeEventListener("focus", focus); };
  }, [revalidate, session]);
  useEffect(() => {
    const title = pathname.endsWith("/edit") ? "Edit event" : pathname === "/events/new" ? "Create an event" : eventTitle || ({ "/": "Experiences worth sharing", "/events": "Explore events", "/auth": "Your account", "/newsletter": "Newsletter" }[pathname] || "Gather");
    document.title = `${title} · Gather`;
  }, [pathname, eventTitle]);
  return <>
    <a className="skip-link" href="#main-content">Skip to content</a><MainNavigation />
    {navigation.state !== "idle" && <div className="navigation-status" role="status">{navigation.state === "submitting" ? "Saving…" : "Loading…"}</div>}
    {sessionWarning && <p className="session-warning" role="status">Your session could not be checked. Please try again when your connection is restored.</p>}
    <main id="main-content" aria-busy={navigation.state !== "idle"}><Outlet /></main>
    <footer className="site-footer"><span>Gather<span className="brand-dot">.</span></span><p>Good people. Shared experiences. Lasting connections.</p><small>Made for your community.</small></footer>
    <ScrollRestoration />
  </>;
}
