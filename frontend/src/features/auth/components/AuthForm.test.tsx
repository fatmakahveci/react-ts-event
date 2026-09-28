import { fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import AuthForm from "./AuthForm";

function renderForm(action?: () => unknown) {
  const router = createMemoryRouter([{ path: "/auth", element: <AuthForm />, action }], {
    initialEntries: ["/auth?mode=login&redirectTo=%2Fevents%2Fnew"],
  });
  render(<RouterProvider router={router} />);
  return router;
}

test("reveals the entered password and hides it again when switching to signup", async () => {
  const router = renderForm();
  const password = screen.getByLabelText("Password");
  fireEvent.change(password, { target: { value: "My test passphrase" } });
  fireEvent.click(screen.getByRole("button", { name: "Show password" }));
  expect(password).toHaveAttribute("type", "text");
  expect(password).toHaveValue("My test passphrase");
  fireEvent.click(screen.getByRole("link", { name: "Create an account" }));
  await screen.findByRole("heading", { name: "Create an account" });
  expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password");
  expect(screen.getByLabelText("Password")).toHaveAccessibleDescription("Use at least 8 characters.");
  expect(new URLSearchParams(router.state.location.search).get("redirectTo")).toBe("/events/new");
});

test("associates server errors with the correct field and preserves entered data", async () => {
  renderForm(() => ({ errors: { email: "Enter a valid email address." } }));
  const email = screen.getByLabelText("Email");
  fireEvent.change(email, { target: { value: "test@example.com" } });
  fireEvent.submit(screen.getByRole("button", { name: "Log in" }).closest("form")!);
  expect(await screen.findByRole("alert")).toHaveTextContent("Enter a valid email address.");
  expect(email).toHaveValue("test@example.com");
  expect(email).toHaveAttribute("aria-invalid", "true");
  expect(email).toHaveAccessibleDescription("Enter a valid email address.");
});
