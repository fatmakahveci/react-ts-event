import { expect, test } from "vitest";

import { action } from "./Logout";

test("clears the session and redirects home", () => {
  localStorage.setItem("token", "signed-token");
  localStorage.setItem("expiration", "2999-01-01T00:00:00.000Z");

  const response = action() as Response;

  expect(localStorage.getItem("token")).toBeNull();
  expect(localStorage.getItem("expiration")).toBeNull();
  expect(response.headers.get("Location")).toBe("/");
});
