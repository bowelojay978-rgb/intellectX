import { AuthPageShell } from "@/components/auth/auth-page-shell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot password - IntellectX",
  description: "Learner password reset for IntellectX.",
};

export default function ForgotPasswordPage() {
  return <AuthPageShell mode="forgot-password" />;
}
