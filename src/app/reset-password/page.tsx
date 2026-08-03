import { redirect } from "next/navigation";
import { ROUTES } from "@/constants";

// The password reset flow is now OTP-based and lives entirely on the
// /forgot-password page. Any old emailed reset links land here and are
// redirected to start the new flow.
export default function ResetPasswordPage() {
  redirect(ROUTES.FORGOT_PASSWORD);
}
