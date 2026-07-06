import { ClerkAuthPanel } from "@/components/auth/clerk-auth-panel";
import { LearnerSessionForm } from "@/components/auth/learner-session-form";
import { Footer } from "@/components/footer/footer";
import { Nav } from "@/components/hero/nav";
import { BackgroundBlur } from "@/components/ui/background-blur";
import { isClerkAuthEnabled } from "@/lib/auth-mode";

type AuthPageShellProps = {
  mode: "login" | "signup" | "forgot-password";
};

export function AuthPageShell({ mode }: AuthPageShellProps) {
  const authPanel =
    isClerkAuthEnabled() && mode !== "forgot-password" ? (
      <ClerkAuthPanel mode={mode} />
    ) : (
      <LearnerSessionForm mode={mode} />
    );

  return (
    <>
      <div className="relative isolate min-h-screen overflow-hidden px-6 pt-28 pb-10 md:px-10">
        <BackgroundBlur className="-top-40 md:-top-0" />
        <Nav />
        <main className="mx-auto grid min-h-[calc(100vh-11rem)] w-full max-w-6xl items-center gap-10 lg:grid-cols-[1fr_440px]">
          <section className="max-w-2xl">
            <p className="text-muted-foreground mb-4 text-xs font-semibold tracking-[0.18em] uppercase">
              IntellectX learner access
            </p>
            <h1 className="text-4xl leading-[1.08] font-medium tracking-tight md:text-6xl">
              Learner access for this browser.
            </h1>
            <p className="text-muted-foreground mt-5 max-w-xl leading-7">
              These pages create a learner session stored on this device while account-level persistence is being completed.
              Session details can be cleared from the profile page.
            </p>
          </section>
          {authPanel}
        </main>
      </div>
      <Footer />
    </>
  );
}
