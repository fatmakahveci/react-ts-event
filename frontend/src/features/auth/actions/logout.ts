import { redirect } from "react-router-dom";
import { clearSession, notifySessionChange } from "../lib/session";
import { apiRequest, responseError } from "../../../lib/api-client";
export async function action() {
  const response = await apiRequest("/logout", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
  if (!response.ok) throw await responseError(response, "Could not log out. Please try again.");
  clearSession();
  notifySessionChange();
  return redirect("/");
}
