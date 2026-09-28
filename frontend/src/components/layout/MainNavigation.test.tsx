import { fireEvent, render, screen, within } from "@testing-library/react";
import { createMemoryRouter, Outlet, RouterProvider } from "react-router-dom";
import MainNavigation from "./MainNavigation";

function renderNavigation() {
  const router = createMemoryRouter([{
    id: "root",
    element: <><MainNavigation /><Outlet /></>,
    children: [
      { path: "/", element: <h1>Home page</h1> },
      { path: "/newsletter", element: <h1>Newsletter page</h1> },
    ],
  }]);
  render(<RouterProvider router={router} />);
}

test("opens the menu and returns focus to its toggle when Escape is pressed", () => {
  renderNavigation();
  const toggle = screen.getByRole("button", { name: "Open menu" });
  expect(toggle).toHaveAttribute("aria-expanded", "false");
  fireEvent.click(toggle);
  expect(toggle).toHaveAttribute("aria-expanded", "true");
  const link = within(screen.getByRole("navigation", { name: "Main navigation" })).getByRole("link", { name: "Newsletter" });
  link.focus();
  fireEvent.keyDown(link, { key: "Escape" });
  expect(toggle).toHaveAttribute("aria-expanded", "false");
  expect(toggle).toHaveFocus();
});

test("closes the menu after choosing a page and identifies the current navigation link", async () => {
  renderNavigation();
  fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
  const newsletter = screen.getByRole("link", { name: "Newsletter" });
  fireEvent.click(newsletter);
  expect(await screen.findByRole("heading", { name: "Newsletter page" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Open menu" })).toHaveAttribute("aria-expanded", "false");
  expect(newsletter).toHaveAttribute("aria-current", "page");
});
