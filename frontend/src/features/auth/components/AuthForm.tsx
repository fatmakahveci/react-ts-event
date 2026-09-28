import { useState } from "react";
import { Form, Link, useActionData, useNavigation, useSearchParams } from "react-router-dom";
import Icon from "../../../components/ui/Icon";
import classes from "./AuthForm.module.css";

interface ActionData {
  errors?: Record<string, string>;
  message?: string;
}

export default function AuthForm() {
  const [visible, setVisible] = useState(false);
  const result = useActionData() as ActionData | undefined;
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();
  const isLogin = searchParams.get("mode") !== "signup";
  const pending = navigation.state !== "idle";
  const switchParams = new URLSearchParams({
    mode: isLogin ? "signup" : "login",
    ...(searchParams.get("redirectTo") ? { redirectTo: searchParams.get("redirectTo")! } : {}),
  });

  return <section className={classes.layout} aria-label="Your Gather account">
    <div className={classes.welcome}>
      <span className={classes.eyebrow}>A PLACE FOR YOUR PEOPLE</span>
      <div className={classes.symbol} aria-hidden="true">✳</div>
      <h2>Good things<br /> start with<br /> <em>showing up.</em></h2>
      <p>A workshop, a conversation, a shared idea. Make something worth getting together for.</p>
      <ul><li><Icon name="check" />Find your next experience</li><li><Icon name="check" />Host a gathering of your own</li></ul>
      <Link to="/events">Take a look around<Icon name="arrow" /></Link>
    </div>
    <Form method="post" className={classes.form}>
      <span className="eyebrow">{isLogin ? "WELCOME BACK" : "LET’S GET TOGETHER"}</span>
      <h1>{isLogin ? "Log in" : "Create an account"}</h1>
      <p className={classes.intro}>{isLogin ? "Your next good plan is waiting." : "A few details, and you’re part of it."}</p>
      {(result?.errors || result?.message) && <div role="alert" className="form-error">
        {result.message && <p>{result.message}</p>}
        {result.errors && <ul>{Object.entries(result.errors).map(([field, message]) => <li id={`auth-${field}-error`} key={field}>{message}</li>)}</ul>}
      </div>}
      <div className={classes.field}>
        <label htmlFor="email">Email</label>
        <input id="email" type="email" name="email" autoComplete="email" maxLength={254} placeholder="you@example.com" required aria-invalid={!!result?.errors?.email} aria-describedby={result?.errors?.email ? "auth-email-error" : undefined} />
      </div>
      <div className={classes.field}>
        <label htmlFor="password">Password</label>
        <div className={classes.password}>
          <input id="password" type={visible ? "text" : "password"} name="password" autoComplete={isLogin ? "current-password" : "new-password"} minLength={isLogin ? 1 : 8} required aria-invalid={!!result?.errors?.password} aria-describedby={[result?.errors?.password ? "auth-password-error" : "", !isLogin ? "password-hint" : ""].filter(Boolean).join(" ") || undefined} />
          <button type="button" className={classes.visibility} aria-label={visible ? "Hide password" : "Show password"} aria-pressed={visible} onClick={() => setVisible(!visible)}><Icon name="eye" /></button>
        </div>
        {!isLogin && <p id="password-hint" className={classes.hint}>Use at least 8 characters.</p>}
      </div>
      <button className={classes.submit} disabled={pending}>{pending ? "Please wait…" : isLogin ? "Log in" : "Create account"}<Icon name="arrow" /></button>
      <p className={classes.switch}>{isLogin ? "New to Gather? " : "Already have an account? "}<Link to={`?${switchParams}`} onClick={() => setVisible(false)}>{isLogin ? "Create an account" : "Log in"}</Link></p>
    </Form>
  </section>;
}
