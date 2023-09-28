"use client";

export type EventType = {
	date: any;
	description: any;
	id: string;
	image: any;
	title: string;
};

export interface EventsListProps {
	events: EventType[];
};
