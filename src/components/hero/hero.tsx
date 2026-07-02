import { Nav } from "@/components/hero/nav";
import { BackgroundBlur } from "@/components/ui/background-blur";
import { Button } from "@/components/ui/button";
import { Pill, PillAvatar, PillAvatarGroup } from "@/components/ui/pill";
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

        <HeroInsightChart />
      </div>
    </div>
  );
}

function HeroInsightChart() {
  const chartBackground =
    "conic-gradient(from -58deg, #111827 0deg 38deg, transparent 38deg 45deg, #2563eb 45deg 112deg, transparent 112deg 119deg, #06b6d4 119deg 164deg, transparent 164deg 171deg, #a855f7 171deg 232deg, transparent 232deg 239deg, #f59e0b 239deg 282deg, transparent 282deg 289deg, #ec4899 289deg 332deg, transparent 332deg 338deg, #111827 338deg 360deg)";

  return (
    <section className="w-full max-w-5xl py-4 text-center md:py-8" aria-label="IntellectX insight chart preview">
      <div className="mx-auto grid max-w-4xl place-items-center px-4">
        <div className="relative grid min-h-[330px] w-full place-items-center sm:min-h-[420px] md:min-h-[500px]">
          <div className="absolute left-1/2 top-1/2 size-[19rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,_rgba(99,102,241,0.24),_transparent_68%)] blur-3xl sm:size-[26rem] md:size-[32rem]" />

          <div className="relative size-[17rem] rounded-full sm:size-[23rem] md:size-[29rem]">
            <div
              className="absolute inset-0 rounded-full shadow-[0_34px_110px_rgba(15,23,42,0.18)]"
              style={{ background: chartBackground }}
            />
            <div className="absolute inset-[7%] rounded-full border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]" />
            <div className="absolute inset-[20%] grid place-items-center rounded-full border border-white/70 bg-background/90 px-8 text-center shadow-[0_20px_60px_rgba(15,23,42,0.12)] backdrop-blur">
              <div>
                <p className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.2em]">
                  Learning loop
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  Focus. Test. Improve.
                </p>
              </div>
            </div>
          </div>
        </div>

        <blockquote className="-mt-2 max-w-3xl text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl md:text-4xl">
          Turn every study session into a clearer next move.
        </blockquote>

        <p className="text-muted-foreground mt-4 max-w-2xl text-sm leading-6 sm:text-base">
          IntellectX connects focused lessons, adaptive quizzes, and visible progress so students know exactly what to
          work on next.
        </p>
      </div>
    </section>
  );
}
