import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { routes } from "../app/router";
import { clearSession, SESSION_CHANGE_KEY, type Session } from "../features/auth/lib/session";

const event = { id: "event-1", ownerId: "owner", title: "Community Meetup", description: "Meet your community", date: "2030-06-15", image: "https://example.com/event.jpg" };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
let router: ReturnType<typeof createMemoryRouter>;
let session: Session | null;
let sessionFailure: boolean;
let releaseSession: (() => void) | undefined;
let sessionDelay: Promise<void> | undefined;
let requests: { path: string; method: string }[];
let events: typeof event[];

beforeEach(() => {
  localStorage.clear();
  clearSession();
  session = { user: { id: "owner", email: "owner@example.com" }, expiresAt: Date.now() + 3600000 };
  sessionFailure = false;
  sessionDelay = undefined;
  releaseSession = undefined;
  requests = [];
  events = [{ ...event }];
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  // Mock only the network boundary: route loaders, actions, forms, and session code are real.
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input, options) => {
    const path = new URL(String(input)).pathname;
    const method = options?.method || "GET";
    requests.push({ path, method });
    if (path === "/session") {
      if (sessionDelay) await sessionDelay;
      if (sessionFailure) throw new TypeError("Offline");
      return session ? json(session) : json({ message: "Not authenticated." }, 401);
    }
    if (path === "/events" && method === "GET") return json({ events });
    if (path === "/events/event-1" && method === "DELETE") { events = []; return json({ message: "Deleted." }); }
    if (path === "/events/event-1") return json({ event });
    if (path === "/logout") { session = null; return new Response(null, { status: 204 }); }
    if (path === "/login") {
      session = { user: { id: "owner", email: "owner@example.com" }, expiresAt: Date.now() + 3600000 };
      return json(session);
    }
    throw new Error(`Unexpected request: ${method} ${path}`);
  });
});
afterEach(async () => {
  cleanup();
  router?.dispose();
  releaseSession?.();
  await Promise.resolve();
  clearSession();
});
function open(path: string) {
  router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<RouterProvider router={router} />);
}
async function idle() {
  await waitFor(() => {
    expect(router.state.navigation.state).toBe("idle");
    expect(router.state.revalidation).toBe("idle");
  });
}

test("keeps every typed search character without waiting for session requests", async () => {
  open("/events");
  const input = await screen.findByRole("searchbox");
  const initialChecks = requests.filter(request => request.path === "/session").length;
  sessionDelay = new Promise(resolve => { releaseSession = resolve; });
  for (const character of "Community") {
    await act(async () => { fireEvent.change(input, { target: { value: (input as HTMLInputElement).value + character } }); });
  }
  await act(async () => { releaseSession?.(); });
  await idle();
  expect(input).toHaveValue("Community");
  expect(new URLSearchParams(router.state.location.search).get("q")).toBe("Community");
  expect(requests.filter(request => request.path === "/session")).toHaveLength(initialChecks);
  expect(screen.getByRole("heading", { name: "Community Meetup" })).toBeInTheDocument();
});

test.each(["focus", "storage"])("preserves an unsaved form when a %s session check loses connection", async trigger => {
  open("/events/new");
  const title = await screen.findByLabelText("Event title");
  fireEvent.change(title, { target: { value: "My unsaved idea" } });
  fireEvent.change(screen.getByLabelText("Description"), { target: { value: "Keep these details too" } });
  const checks = requests.filter(request => request.path === "/session").length;
  sessionFailure = true;
  await act(async () => {
    window.dispatchEvent(trigger === "focus" ? new Event("focus") : new StorageEvent("storage", { key: SESSION_CHANGE_KEY, newValue: "another-tab" }));
  });
  await waitFor(() => expect(requests.filter(request => request.path === "/session").length).toBeGreaterThan(checks));
  await idle();
  expect(screen.getByLabelText("Event title")).toHaveValue("My unsaved idea");
  expect(screen.getByLabelText("Description")).toHaveValue("Keep these details too");
  expect(screen.getByRole("status")).toHaveTextContent(/session.*check/i);

  sessionFailure = false;
  await act(async () => { window.dispatchEvent(new Event("focus")); });
  await waitFor(() => expect(screen.queryByText(/session.*check/i)).not.toBeInTheDocument());
  expect(screen.getByLabelText("Event title")).toHaveValue("My unsaved idea");
});

test("refreshes the account controls after a verified logout in another tab", async () => {
  open("/");
  await screen.findByRole("button", { name: "Log out" });
  session = null;
  await act(async () => { window.dispatchEvent(new StorageEvent("storage", { key: SESSION_CHANGE_KEY, newValue: "logout" })); });
  expect(await screen.findByRole("link", { name: /Log in/ })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Log out" })).not.toBeInTheDocument();
});

test("returns to the protected form after login and updates the navigation", async () => {
  session = null;
  open("/events/new");
  await screen.findByRole("heading", { name: "Log in" });
  expect(new URLSearchParams(router.state.location.search).get("redirectTo")).toBe("/events/new");
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "owner@example.com" } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: "test-password" } });
  fireEvent.submit(screen.getByRole("button", { name: "Log in" }).closest("form")!);
  expect(await screen.findByRole("heading", { name: "Create an event" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Log out" })).toBeInTheDocument();
  expect(requests).toContainEqual({ path: "/login", method: "POST" });
});

test("deletes an owned event only after explicit confirmation", async () => {
  open("/events/event-1");
  const remove = await screen.findByRole("button", { name: "Delete" });
  fireEvent.click(remove);
  fireEvent.click(screen.getByRole("button", { name: "Keep event" }));
  expect(requests.some(request => request.method === "DELETE")).toBe(false);
  fireEvent.click(remove);
  fireEvent.click(screen.getByRole("button", { name: "Confirm delete" }));
  await screen.findByRole("heading", { name: "All Events" });
  expect(requests.filter(request => request.method === "DELETE")).toEqual([{ path: "/events/event-1", method: "DELETE" }]);
  expect(screen.queryByRole("heading", { name: event.title })).not.toBeInTheDocument();
});

test("hides editing controls and rejects the edit page for another organizer", async () => {
  session!.user.id = "another-user";
  open("/events/event-1");
  await screen.findByRole("heading", { name: event.title });
  expect(screen.queryByRole("link", { name: "Edit" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
  await act(async () => { await router.navigate("/events/event-1/edit"); });
  expect(await screen.findByRole("heading", { name: "Only the organizer can edit this event" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Save event" })).not.toBeInTheDocument();
});
