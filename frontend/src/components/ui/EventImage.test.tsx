import { fireEvent, render, screen } from "@testing-library/react";
import EventImage from "./EventImage";
test("uses the bundled fallback for broken images and retries a changed source", () => {
  const view = render(<EventImage src="https://example.com/missing.jpg" alt="Event" />);
  fireEvent.error(screen.getByAltText("Event"));
  expect(screen.getByAltText("Event")).toHaveAttribute("src", "/images/community-meetup.jpg");
  view.rerender(<EventImage src="https://example.com/new.jpg" alt="Event" />);
  expect(screen.getByAltText("Event")).toHaveAttribute("src", "https://example.com/new.jpg");
});
