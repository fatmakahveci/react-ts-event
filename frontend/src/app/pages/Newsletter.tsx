"use client";

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

export const action = async (): Promise<{ message: string }> => {
	return { message: "Signup successful!" };
};
