"use client";

import { Link, Outlet } from 'react-router-dom';

import Header from "../Header/Header";
import EventsIntroSection from "../EventsIntroSection/EventsIntroSection";
import FindEventSection from "../FindEventSection/FindEventSection";
import NewEventsSection from "../NewEventsSection/NewEventsSection";

export default function Events() {
  return (
    <>
      <Outlet />
      <Header>
        <Link to="/events/new" className="button">
          New Event
        </Link>
      </Header>
      <main>
        <EventsIntroSection />
        <NewEventsSection />
        <FindEventSection />
      </main>
    </>
  );
}
