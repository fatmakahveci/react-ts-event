import { fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { expect, test, vi } from "vitest";

import AuthPage from "../features/auth/pages/AuthPage";
import EventDetailsPage from "../features/events/pages/EventDetailsPage";
import EventsPage from "../features/events/pages/EventsPage";
import NewsletterPage, { action as newsletterAction } from "../features/newsletter/pages/NewsletterPage";

const event = {
  id: "event-1",
  title: "React Summit",
  description: "A community conference",
  date: "2030-06-15",
  image: "https://example.com/event.jpg",
  location: "Amsterdam",
};

test("renders the login form", async () => {
  const router = createMemoryRouter(
    [{ path: "/auth", element: <AuthPage /> }],
    { initialEntries: ["/auth?mode=login"] }
  );
  render(<RouterProvider router={router} />);

  expect(await screen.findByRole("heading", { name: "Log in" })).toBeInTheDocument();
  expect(screen.getByLabelText("Email")).toBeInTheDocument();
});

test("renders loaded event collections", async () => {
  const router = createMemoryRouter(
    [
      {
        path: "/events",
        element: <EventsPage />,
        loader: () => ({ events: Promise.resolve([event]) }),
      },
    ],
    { initialEntries: ["/events"] }
  );
  render(<RouterProvider router={router} />);

  expect(await screen.findByRole("heading", { name: "All Events" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "React Summit" })).toBeInTheDocument();
});

test("renders selected event details and related events", async () => {
  const router = createMemoryRouter(
    [
      {
        id: "root",
        loader: () => null,
        children: [
          {
            path: "/events/event-1",
            id: "event-detail",
            element: <EventDetailsPage />,
            loader: () => ({ event, events: Promise.resolve([event]) }),
          },
        ],
      },
    ],
    { initialEntries: ["/events/event-1"] }
  );
  render(<RouterProvider router={router} />);

  expect(await screen.findByRole("heading", { name: "React Summit" })).toBeInTheDocument();
  expect(await screen.findByRole("heading", { name: "More experiences" })).toBeInTheDocument();
});

test("renders newsletter signup and returns a success message", async () => {
  const router = createMemoryRouter(
    [
      {
        path: "/newsletter",
        element: <NewsletterPage />,
        action: newsletterAction,
      },
    ],
    { initialEntries: ["/newsletter"] }
  );
  render(<RouterProvider router={router} />);

  expect(
    await screen.findByRole("heading", { name: "Stay in the loop" })
  ).toBeInTheDocument();
  const fetch = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ message: "Your subscription has been saved." }), { headers: { "Content-Type": "application/json" } }));
  fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "reader@example.com" } });
  fireEvent.submit(screen.getByRole("button", { name: "Subscribe" }).closest("form")!);
  expect(await screen.findByRole("status")).toHaveTextContent("Your subscription has been saved.");
  expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/newsletter"), expect.objectContaining({ body: JSON.stringify({ email: "reader@example.com" }) }));
});
