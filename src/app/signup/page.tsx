import { AuthPageShell } from "@/components/auth/auth-page-shell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign up - IntellectX",
  description: "Prototype demo signup for IntellectX.",
};

export default function SignupPage() {
  return <AuthPageShell mode="signup" />;
}
