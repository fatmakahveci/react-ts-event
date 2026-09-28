import type { ActionFunctionArgs } from "react-router-dom";
import NewsletterSignup from "../components/NewsletterSignup";
import PageContent from "../../../components/ui/PageContent";
import { apiRequest } from "../../../lib/api-client";

export default function NewsletterPage() {
  return <PageContent title="Stay in the loop"><p>Save your email to the Gather newsletter list.</p><NewsletterSignup /></PageContent>;
}
export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  try {
    return await apiRequest("/newsletter", { method: "POST", signal: request.signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: form.get("email") }) });
  } catch (error) {
    if (request.signal.aborted) throw error;
    return { message: "Could not save your subscription. Please try again." };
  }
}
