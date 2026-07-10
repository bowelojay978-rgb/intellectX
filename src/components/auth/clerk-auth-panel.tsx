import { SignIn, SignUp } from "@clerk/nextjs";

type ClerkAuthPanelProps = {
  mode: "login" | "signup";
};

export function ClerkAuthPanel({ mode }: ClerkAuthPanelProps) {
  if (mode === "signup") {
    return <SignUp forceRedirectUrl="/onboarding" fallbackRedirectUrl="/onboarding" />;
  }

  return <SignIn forceRedirectUrl="/courses" fallbackRedirectUrl="/courses" />;
}
