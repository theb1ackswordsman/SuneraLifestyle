import { redirect } from "next/navigation";

// Admin login is handled through the unified /login page.
// Role detection happens server-side — admin sees portal code step automatically.
export default function AdminLoginPage() {
  redirect("/login");
}
