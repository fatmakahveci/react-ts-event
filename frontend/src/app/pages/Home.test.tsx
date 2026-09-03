import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import HomePage from "./Home";

test("renders the event application home page", () => {
  render(<HomePage />);

  expect(screen.getByRole("heading", { name: "HomePage" })).toBeInTheDocument();
});
