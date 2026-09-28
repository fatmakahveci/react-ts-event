import { useFetcher } from "react-router-dom";
import classes from "./NewsletterSignup.module.css";
export default function NewsletterSignup() {
  const fetcher = useFetcher<{ message?: string }>();
  const pending = fetcher.state !== "idle";
  return <fetcher.Form method="post" action="/newsletter" className={classes.newsletter}>
    <label htmlFor="newsletter-email">Email address</label>
    <input id="newsletter-email" name="email" type="email" required maxLength={254} autoComplete="email" placeholder="you@example.com" />
    <button disabled={pending}>{pending ? "Saving…" : "Subscribe"}</button>
    {fetcher.data?.message && <p role="status">{fetcher.data.message}</p>}
  </fetcher.Form>;
}
