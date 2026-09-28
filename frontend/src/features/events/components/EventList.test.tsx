import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import EventList from "./EventList";

beforeEach(() => localStorage.clear());

const events = [
  { id: "1", title: "Zebra meetup", description: "Creative people", date: "2030-01-01", image: "https://example.com/1.jpg" },
  { id: "2", title: "Art workshop", description: "Learn painting", date: "2030-02-01", image: "https://example.com/2.jpg" },
];
test("filters events, handles no matches, and resets the search", () => {
  render(<MemoryRouter><EventList events={events} /></MemoryRouter>);
  fireEvent.change(screen.getByLabelText("Search events"), { target: { value: "painting" } });
  expect(screen.getByRole("heading", { name: "Art workshop" })).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "Zebra meetup" })).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Search events"), { target: { value: "missing" } });
  expect(screen.getByText("No matches just yet")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
  expect(screen.getByRole("status")).toHaveTextContent("2 experiences");
});
test("sorts a copy of the event collection by name", () => {
  render(<MemoryRouter><EventList events={events} /></MemoryRouter>);
  fireEvent.change(screen.getByLabelText("Sort by"), { target: { value: "title" } });
  expect(screen.getAllByRole("heading", { level: 2 }).map(node => node.textContent)).toEqual(["Art workshop", "Zebra meetup"]);
  expect(events[0].title).toBe("Zebra meetup");
});

function Location() { return <output data-testid="location">{useLocation().search}</output>; }
test("restores URL filters and writes searches and sorting back to the URL", () => {
  render(<MemoryRouter initialEntries={["/events?q=painting&sort=title"]}><EventList events={events} /><Location /></MemoryRouter>);
  expect(screen.getByRole("searchbox")).toHaveValue("painting");
  expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(1);
  fireEvent.change(screen.getByRole("searchbox"), { target: { value: "Creative" } });
  expect(screen.getByTestId("location")).toHaveTextContent("q=Creative");
  fireEvent.change(screen.getByLabelText("Sort by"), { target: { value: "date" } });
  expect(screen.getByTestId("location")).toHaveTextContent("sort=date");
});
test("persists favorites and shows only saved events", () => {
  render(<MemoryRouter><EventList events={events} /></MemoryRouter>);
  fireEvent.click(screen.getByRole("button", { name: "Save Art workshop to favorites" }));
  expect(JSON.parse(localStorage.getItem("gather:favorite-events")!)).toEqual(["2"]);
  fireEvent.click(screen.getByRole("button", { name: /Saved events/ }));
  expect(screen.queryByRole("heading", { name: "Zebra meetup" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Remove Art workshop from favorites" }));
  expect(screen.getByText("No matches just yet")).toBeInTheDocument();
});
test("paginates results and resets page when the filter changes", () => {
  const collection = Array.from({ length: 8 }, (_, index) => ({ ...events[0], id: String(index), title: `Meetup ${index}` }));
  render(<MemoryRouter><EventList events={collection} /><Location /></MemoryRouter>);
  expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(6);
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(2);
  expect(screen.getByTestId("location")).toHaveTextContent("page=2");
  fireEvent.change(screen.getByRole("searchbox"), { target: { value: "Meetup 0" } });
  expect(screen.getByRole("heading", { name: "Meetup 0" })).toBeInTheDocument();
  expect(screen.getByTestId("location")).not.toHaveTextContent("page=");
});
test("filters past and upcoming dates and tolerates corrupted favorites", () => {
  localStorage.setItem("gather:favorite-events", "broken JSON");
  render(<MemoryRouter><EventList events={[{ ...events[0], date: "2000-01-01" }, { ...events[1], date: "2999-01-01" }]} /></MemoryRouter>);
  fireEvent.change(screen.getByLabelText("When"), { target: { value: "upcoming" } });
  expect(screen.getByRole("heading", { name: "Art workshop" })).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "Zebra meetup" })).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("When"), { target: { value: "past" } });
  expect(screen.getByRole("heading", { name: "Zebra meetup" })).toBeInTheDocument();
});

test("reports unavailable storage without claiming a favorite was saved", () => {
  vi.spyOn(localStorage, "setItem").mockImplementation(() => { throw new Error("Quota exceeded"); });
  render(<MemoryRouter><EventList events={events} /></MemoryRouter>);
  const favorite = screen.getByRole("button", { name: "Save Art workshop to favorites" });
  fireEvent.click(favorite);
  expect(screen.getByRole("alert")).toHaveTextContent("Your browser could not save favorites");
  expect(favorite).toHaveAttribute("aria-pressed", "false");
  expect(localStorage.getItem("gather:favorite-events")).toBeNull();
});

test("synchronizes favorites between lists in the same tab and from another tab", () => {
  render(<MemoryRouter><EventList events={events} /><EventList events={events} related /></MemoryRouter>);
  fireEvent.click(screen.getAllByRole("button", { name: "Save Art workshop to favorites" })[0]);
  const saved = screen.getAllByRole("button", { name: "Remove Art workshop from favorites" });
  expect(saved).toHaveLength(2);
  saved.forEach(button => expect(button).toHaveAttribute("aria-pressed", "true"));

  localStorage.setItem("gather:favorite-events", "[]");
  fireEvent(window, new StorageEvent("storage", { key: "gather:favorite-events", newValue: "[]" }));
  const removed = screen.getAllByRole("button", { name: "Save Art workshop to favorites" });
  expect(removed).toHaveLength(2);
  removed.forEach(button => expect(button).toHaveAttribute("aria-pressed", "false"));
});
