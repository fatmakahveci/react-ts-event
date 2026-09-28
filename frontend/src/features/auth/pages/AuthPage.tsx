import { data, redirect } from "react-router-dom";
import AuthForm from "../components/AuthForm";
import { apiRequest, readJson, responseError } from "../../../lib/api-client";
import { safeReturnTo, rememberSession, notifySessionChange, type Session } from "../lib/session";

export default function AuthPage() { return <AuthForm />; }
export async function action({ request }: { request: Request }) {
  const params = new URL(request.url).searchParams;
  const mode = params.get("mode") || "login";
  if (mode !== "login" && mode !== "signup") throw data({ message: "Unsupported authentication mode." }, { status: 422 });
  const form = await request.formData();
  const response = await apiRequest(`/${mode}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, signal: request.signal,
    body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
  });
  if ([401, 422, 429].includes(response.status)) return response;
  if (!response.ok) throw await responseError(response, "Could not authenticate user.");
  rememberSession(await readJson<Session>(response));
  notifySessionChange();
  return redirect(safeReturnTo(params.get("redirectTo")));
}
