import { useState } from "react";
import {
	Form,
	Link,
	useActionData,
	useNavigation,
	useSearchParams,
} from "react-router-dom";

import classes from "./AuthForm.module.css";

interface ActionData {
	errors?: { [key: string]: string };
	message?: string;
}

const AuthForm = () => {
	const [visible, setVisible] = useState(false);
	const data = useActionData() as ActionData;
	const navigation = useNavigation();
	const [searchParams] = useSearchParams();
	const isLogin: boolean = searchParams.get("mode") !== "signup";
	const isSubmitting: boolean = navigation.state === "submitting";

	return (
		<>
			<Form method="post" className={classes.form}>
				<h1>{isLogin ? "Log in" : "Create a new user"}</h1>
				{data && data.errors && (
					<ul role="alert">
						{Object.values(data.errors).map((err) => (
							<li key={err}>{err}</li>
						))}
					</ul>
				)}
				{data && data.message && <p role="alert">{data.message}</p>}
				<p>
					<label htmlFor="email">Email</label>
					<input id="email" type="email" name="email" autoComplete="email" required />
				</p>
				<p>
					<label htmlFor="password">Password</label>
					<input
						id="password"
						type={visible ? "text" : "password"}
						name="password"
                        autoComplete={isLogin ? "current-password" : "new-password"}
                        minLength={isLogin ? 1 : 8}
						required
					/>
				</p>
                <button type="button" className="text-button" aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? "Hide password" : "Show password"}</button>
                {!isLogin && <p>Use at least 8 characters (up to 72 UTF-8 bytes).</p>}
				<div className={classes.actions}>
					<Link to={`?${new URLSearchParams({ mode: isLogin ? "signup" : "login", ...(searchParams.get("redirectTo") ? { redirectTo: searchParams.get("redirectTo")! } : {}) })}`}>
						{isLogin ? "Create new user" : "Login"}
					</Link>
					<button disabled={isSubmitting}>
						{isSubmitting ? "Submitting..." : isLogin ? "Log in" : "Create account"}
					</button>
				</div>
			</Form>
		</>
	);
};

export default AuthForm;
