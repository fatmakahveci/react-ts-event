"use client";

import { useRouteError } from "react-router-dom";
import MainNavigation from "../components/MainNavigation/MainNavigation";
import PageContent from "../components/PageContent/PageContent";

const ErrorPage = () => {
	const error: any = useRouteError();

	let title: string = "An error occurred!";
	let message: string = "Something went wrong!";

	if (error.status === 500) {
		message = JSON.parse(error.data).message;
	}

	if (error.status === 404) {
		title = "Not found!";
		message = "Could not find resource or page.";
	}
	return (
		<>
			<MainNavigation />
			<PageContent title={title}>
				<p>{message}</p>
			</PageContent>
		</>
	);
};
export default ErrorPage;
