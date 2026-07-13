import { LearnerOnboarding } from "@/components/auth/learner-onboarding";
import { PageShell } from "@/components/education/page-shell";
import { Badge } from "@/components/ui/badge";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Onboarding - IntellectX",
  description: "Complete your mandatory IntellectX Study Profile before entering your study experience.",
};

export default function OnboardingPage() {
  return (
    <PageShell>
      <section className="mx-auto max-w-4xl">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <Badge variant="secondary" className="uppercase">
            Learner onboarding
          </Badge>
          <h1 className="text-4xl leading-[1.1] font-medium tracking-tight md:text-6xl">
            Set up your Study Profile
          </h1>
          <p className="text-muted-foreground max-w-2xl leading-6 md:text-lg">
            Complete your academic profile first. IntellectX will then continue to the correct study experience for
            this device.
          </p>
        </div>
        <LearnerOnboarding />
      </section>
    </PageShell>
  );
}
