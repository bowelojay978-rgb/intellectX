import { AuthPageShell } from "@/components/auth/auth-page-shell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login - IntellectX",
  description: "Prototype demo login for IntellectX.",
};

export default function LoginPage() {
  return <AuthPageShell mode="login" />;
}
