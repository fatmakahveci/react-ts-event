"use client";

import { ReactNode } from "react";

export type EventType = {
	date: any;
	description: any;
	id: string;
	image: any;
	title: string;
};

export type EventTypeProps = {
	event: EventType;
}
export interface EventsListProps {
	events: EventType[];
}

export type PageContentProps = {
	title: string;
	children: ReactNode;
};
