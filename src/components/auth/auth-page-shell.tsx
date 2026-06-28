import { LearnerSessionForm } from "@/components/auth/learner-session-form";
import { Footer } from "@/components/footer/footer";
import { Nav } from "@/components/hero/nav";
import { BackgroundBlur } from "@/components/ui/background-blur";

type AuthPageShellProps = {
  mode: "login" | "signup" | "forgot-password";
};

export function AuthPageShell({ mode }: AuthPageShellProps) {
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
              Premium learning access, minus the production auth setup.
            </h1>
            <p className="text-muted-foreground mt-5 max-w-xl leading-7">
              These pages create a local learner session for fast navigation and testing while the product experience is being shaped.
              Credentials are accepted locally and can be cleared from the profile page.
            </p>
          </section>
          <LearnerSessionForm mode={mode} />
        </main>
      </div>
      <Footer />
    </>
  );
}
