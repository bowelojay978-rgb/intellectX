import { Nav } from "@/components/hero/nav";
import { BackgroundBlur } from "@/components/ui/background-blur";
import { Button } from "@/components/ui/button";
import { Pill, PillAvatar, PillAvatarGroup } from "@/components/ui/pill";
import Image from "next/image";
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
            <Link href="/dashboard">Start Learning</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/courses">Browse Courses</Link>
          </Button>
        </div>
        <Image src="/app-image-1.png" alt="Hero" width={304} height={445} />
      </div>
    </div>
  );
}
