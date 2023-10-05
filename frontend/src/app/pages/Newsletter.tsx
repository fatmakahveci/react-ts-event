"use client";

import { LoaderFunctionArgs } from "react-router-dom";
import NewsletterSignup from "../components/NewsletterSignup/NewsletterSignup";
import PageContent from "../components/PageContent/PageContent";

const NewsletterPage = (): JSX.Element => {
	return (
		<PageContent title="Join our awesome newsletter!">
			<NewsletterSignup />
		</PageContent>
	);
};

export default NewsletterPage;

export const action = async ({
	request,
}: LoaderFunctionArgs): Promise<{ message: string }> => {
	const data: FormData = await request.formData();
	const email = data.get("email");
	console.log(email);
	return { message: "Signup successful!" };
};
