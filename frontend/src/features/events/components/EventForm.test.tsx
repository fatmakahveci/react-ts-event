import { clearSession, rememberSession } from "../../auth/lib/session";
import { beforeEach, expect, test, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import EventForm, { action } from "./EventForm";

beforeEach(() => {
  localStorage.clear();
  rememberSession({ user: { id: "owner", email: "owner@example.com" }, expiresAt: Date.now() + 3600000 });
});
function args(method = "POST") {
  const body = new FormData();
  body.set("title", "Community meetup"); body.set("image", "https://example.com/event.jpg");
  body.set("date", "2030-06-15"); body.set("description", "Meet your community");
  return { request: new Request("http://localhost/events/new", { method, body }), params: { eventId: "event-1" }, context: {}, url: new URL("http://localhost/events/new"), pattern: "/events/new" };
}
test("saves new and edited events with authentication", async () => {
  const fetch = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 201 }));
  for (const method of ["POST", "PATCH"]) {
    const response = await action(args(method)) as Response;
    expect(response.headers.get("Location")).toBe("/events");
    expect(fetch).toHaveBeenLastCalledWith(expect.stringContaining(method === "PATCH" ? "/events/event-1" : "/events"), expect.objectContaining({ method, credentials: "include" }));
  }
});
test("redirects absent sessions without making a write", async () => {
  clearSession();
  const fetch = vi.spyOn(globalThis, "fetch");
  const response = await action(args()) as Response;
  expect(response.headers.get("Location")).toBe("/auth?mode=login&redirectTo=%2Fevents%2Fnew");
  expect(fetch).not.toHaveBeenCalled();
});
test("shows server validation errors and keeps entered values", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ message: "Check your details", errors: { title: "Invalid title." } }), { status: 422 }));
  const router = createMemoryRouter([{ path: "/events/new", element: <EventForm method="post" />, action }], { initialEntries: ["/events/new"] });
  render(<RouterProvider router={router} />);
  fireEvent.change(screen.getByLabelText("Event title"), { target: { value: "My meetup" } });
  fireEvent.submit(screen.getByRole("button", { name: "Save event" }).closest("form")!);
  expect(await screen.findByRole("alert")).toHaveTextContent("Check your details");
  expect(screen.getByLabelText("Event title")).toHaveValue("My meetup");
  expect(screen.getByLabelText("Event title")).toHaveAttribute("aria-invalid", "true");
  expect(screen.getByLabelText("Event title")).toHaveAccessibleDescription("Invalid title.");
});

test("handles a rejected session and unexpected API failures", async () => {
  const fetch = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 401 }));
  expect((await action(args()) as Response).headers.get("Location")).toBe("/auth?mode=login&redirectTo=%2Fevents%2Fnew");
  rememberSession({ user: { id: "owner", email: "owner@example.com" }, expiresAt: Date.now() + 3600000 });
  fetch.mockResolvedValue(new Response(null, { status: 503 }));
  await expect(action(args())).resolves.toMatchObject({ data: { message: "Could not save your event. Please try again." }, init: { status: 503 } });
});

test("asks before discarding an unsaved event and allows keeping it", async () => {
  const router = createMemoryRouter([
    { path: "/events/new", element: <EventForm method="post" /> },
    { path: "/events", element: <h1>Event collection</h1> },
  ], { initialEntries: ["/events/new"] });
  render(<RouterProvider router={router} />);
  fireEvent.change(screen.getByLabelText("Event title"), { target: { value: "Unsaved idea" } });
  fireEvent.click(screen.getByRole("link", { name: "Cancel" }));
  expect(await screen.findByRole("alertdialog")).toHaveTextContent("Discard your changes?");
  fireEvent.click(screen.getByRole("button", { name: "Keep editing" }));
  expect(screen.getByLabelText("Event title")).toHaveValue("Unsaved idea");
  fireEvent.click(screen.getByRole("link", { name: "Cancel" }));
  fireEvent.click(await screen.findByRole("button", { name: "Discard changes" }));
  expect(await screen.findByRole("heading", { name: "Event collection" })).toBeInTheDocument();
});
test("allows a successful save without an unsaved-changes prompt", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 201 }));
  const router = createMemoryRouter([
    { path: "/events/new", element: <EventForm method="post" />, action },
    { path: "/events", element: <h1>Saved collection</h1> },
  ], { initialEntries: ["/events/new"] });
  render(<RouterProvider router={router} />);
  fireEvent.change(screen.getByLabelText("Event title"), { target: { value: "A new event" } });
  fireEvent.submit(screen.getByRole("button", { name: "Save event" }).closest("form")!);
  expect(await screen.findByRole("heading", { name: "Saved collection" })).toBeInTheDocument();
  expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
});
test("keeps network errors inside the form", async () => {
  vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("offline"));
  await expect(action(args())).resolves.toMatchObject({ data: { message: expect.stringContaining("Your details are still here") }, init: { status: 503 } });
});
