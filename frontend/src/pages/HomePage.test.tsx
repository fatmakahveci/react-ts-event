import { render, screen } from "@testing-library/react";

import { MemoryRouter } from "react-router-dom";

import HomePage from "./HomePage";

test("renders the event application home page", () => {
  render(<MemoryRouter><HomePage /></MemoryRouter>);

  expect(screen.getByRole("heading", { name: /Life is better/i })).toBeInTheDocument();
});
