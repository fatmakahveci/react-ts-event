import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { expect, test } from "vitest";

import AuthenticationPage from "./Authentication";
import EventDetailPage from "./EventDetail";
import EventsPage from "./Events";
import NewsletterPage, { action as newsletterAction } from "./Newsletter";

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
    [{ path: "/auth", element: <AuthenticationPage /> }],
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
            element: <EventDetailPage />,
            loader: () => ({ event, events: Promise.resolve([event]) }),
          },
        ],
      },
    ],
    { initialEntries: ["/events/event-1"] }
  );
  render(<RouterProvider router={router} />);

  expect(await screen.findByRole("heading", { name: "React Summit" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "All Events" })).toBeInTheDocument();
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
    await screen.findByRole("heading", { name: "Join our awesome newsletter!" })
  ).toBeInTheDocument();
  await expect(newsletterAction()).resolves.toEqual({ message: "Signup successful!" });
});
