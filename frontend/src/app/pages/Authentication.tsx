"use client";

import { json, redirect } from "react-router-dom";
import AuthForm from "../components/AuthForm/AuthForm";

const AuthenticationPage = (): JSX.Element => {
	return <AuthForm />;
};
export default AuthenticationPage;

export const action = async ({ request }: { request: any }) => {
	const searchParams: URLSearchParams = new URL(request.url).searchParams;
	const mode: string = searchParams.get("mode") || "login";

	if (mode !== "login" && mode !== "signup") {
		throw json({ message: "Unsupported mode: " + mode }, { status: 422 });
	}

	const data: FormData = await request.formData();
	const authData: Record<string, any> = {
		email: data.get("email"),
		password: data.get("password"),
	};

	const response: Response = await fetch("http://localhost:8080/" + mode, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(authData),
	});

	if (response.status === 422 || response.status === 401) {
		return response;
	}

	if (!response.ok) {
		throw json(
			{ message: "Could not authenticate user." },
			{ status: 500 }
		);
	}

	return redirect("/");
};
