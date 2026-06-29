import { Nav } from "@/components/hero/nav";
import { BackgroundBlur } from "@/components/ui/background-blur";
import { Button } from "@/components/ui/button";
import { Pill, PillAvatar, PillAvatarGroup } from "@/components/ui/pill";
import { BarChart3Icon, BookOpenIcon, GraduationCapIcon, PlayCircleIcon } from "lucide-react";
import Link from "next/link";

export function Hero() {
  return (
    <div className="z-1 grid w-full place-items-center px-8 pt-28 pb-8">
      <BackgroundBlur className="-top-40 md:-top-0" />
      <Nav />
      <div className="flex flex-col items-center gap-6">
        <Pill>
          <PillAvatarGroup className="hidden sm:flex">
            <PillAvatar src="/avatars/1.jpg" />
            <PillAvatar src="/avatars/2.jpg" />
            <PillAvatar src="/avatars/3.jpg" />
            <PillAvatar src="/avatars/4.jpg" />
          </PillAvatarGroup>
          <p className="text-muted-foreground px-2 text-xs font-medium sm:border-l-1 sm:text-sm">
            Join <span className="text-foreground">42,000</span> learners building sharper study habits
          </p>
        </Pill>
        <h1 className="text-center text-4xl leading-[1.1] font-medium tracking-tight sm:text-7xl">
          IntellectX<span className="text-muted-foreground block">Learns With You.</span>
        </h1>
        <p className="max-w-lg text-center leading-6 tracking-tight sm:text-xl">
          AI-guided courses, adaptive quizzes, and focused study workflows for students who want momentum without the
          noise.
        </p>
        <div className="mb-10 flex flex-col gap-3 sm:flex-row">
          <Button size="lg" asChild>
            <Link href="/signup">Start Learning</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/pricing">View Pricing</Link>
          </Button>
        </div>
        <HeroLearningLoop />
      </div>
    </div>
  );
}

function HeroLearningLoop() {
  const steps = [
    {
      label: "Profile",
      detail: "Senior / Botswana",
      icon: GraduationCapIcon,
    },
    {
      label: "Courses",
      detail: "3 selected",
      icon: BookOpenIcon,
    },
    {
      label: "Videos",
      detail: "Lesson playlist",
      icon: PlayCircleIcon,
    },
    {
      label: "Progress",
      detail: "84% average",
      icon: BarChart3Icon,
    },
  ];

  return (
    <section
      className="w-full max-w-4xl overflow-hidden rounded-lg border border-white/70 bg-white/75 p-4 shadow-3xl backdrop-blur dark:border-white/10 dark:bg-card/75 md:p-6"
      aria-label="IntellectX learning loop preview"
    >
      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-lg border bg-background/80 p-4">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.18em]">Next lesson</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">Discrete Mathematics</h2>
            </div>
            <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
              Personalized
            </span>
          </div>
          <div className="aspect-video rounded-lg bg-[linear-gradient(135deg,_#050505,_#1f2937)] p-4 text-white">
            <div className="flex h-full flex-col justify-between">
              <div className="flex items-center gap-2 text-xs text-white/70">
                <PlayCircleIcon className="size-4" />
                Video lesson
              </div>
              <div>
                <p className="max-w-sm text-2xl font-semibold tracking-tight">Sets, logic, and proof patterns</p>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/15">
                  <div className="h-full w-2/3 rounded-full bg-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="grid gap-3">
          {steps.map((step) => {
            const Icon = step.icon;

            return (
              <div key={step.label} className="rounded-lg border bg-background/80 p-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-full bg-secondary">
                    <Icon className="size-5" />
                  </span>
                  <div>
                    <p className="font-medium">{step.label}</p>
                    <p className="text-muted-foreground text-sm">{step.detail}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
