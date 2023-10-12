"use client";

import { redirect } from "react-router-dom";

export const checkAuthLoader = () => {
	const token = getAuthToken();

	if (!token) {
		return redirect("/auth");
	}

	return null;
};

export const getAuthToken = () => {
	const token = localStorage.getItem("token");
	console.log(token);
    if (!token) {
		return null;
	}

	const tokenDuration = getTokenDuration();

	if (tokenDuration < 0) {
		return "EXPIRED";
	}

	return token;
};

export const getTokenDuration = () => {
	const storedExpirationDate = localStorage.getItem("expiration");
	console.log(storedExpirationDate);
	
	if (storedExpirationDate === null) return 0;
	const expirationDate = new Date(storedExpirationDate);
	const now = new Date();
	const duration = expirationDate.getTime() - now.getTime();
	return duration;
};

export const tokenLoader = () => {
	const token = getAuthToken();
	return token;
};
