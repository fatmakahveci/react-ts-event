"use client";

import {
	Form,
	Link,
	Navigation,
	useActionData,
	useNavigation,
	useSearchParams,
} from "react-router-dom";

import classes from "./AuthForm.module.css";

interface ActionData {
	errors?: { [key: string]: string };
	message?: string;
}

const AuthForm = (): JSX.Element => {
	const data = useActionData() as ActionData;
	const navigation: Navigation = useNavigation();
	const [searchParams]: [URLSearchParams, any] = useSearchParams();
	const isLogin: boolean = searchParams.get("mode") === "login";
	const isSubmitting: boolean = navigation.state === "submitting";

	return (
		<>
			<Form method="post" className={classes.form}>
				<h1>{isLogin ? "Log in" : "Create a new user"}</h1>
				{data && data.errors && (
					<ul>
						{Object.values(data.errors).map((err) => (
							<li key={err}>{err}</li>
						))}
					</ul>
				)}
				{data && data.message && <p>{data.message}</p>}
				<p>
					<label htmlFor="email">Email</label>
					<input id="email" type="email" name="email" required />
				</p>
				<p>
					<label htmlFor="password">Password</label>
					<input
						id="password"
						type="password"
						name="password"
						required
					/>
				</p>
				<div className={classes.actions}>
					<Link to={`?mode=${isLogin ? "signup" : "login"}`}>
						{isLogin ? "Create new user" : "Login"}
					</Link>
					<button disabled={isSubmitting}>
						{isSubmitting ? "Submitting..." : "Save"}
					</button>
				</div>
			</Form>
		</>
	);
};

export default AuthForm;
