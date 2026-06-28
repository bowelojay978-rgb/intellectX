import { ConvexCoursesSection } from "@/components/education/convex-courses-section";
import { PageShell } from "@/components/education/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { courses } from "@/data/courses";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Courses - IntellectX",
  description: "Browse IntellectX course tracks with lessons, progress, and quizzes.",
};

export default function CoursesPage() {
  return (
    <PageShell>
      <section className="mb-10 flex flex-col items-center gap-5 text-center">
        <Badge variant="secondary" className="uppercase">
          Courses
        </Badge>
        <h1 className="max-w-3xl text-4xl leading-[1.1] font-medium tracking-tight md:text-6xl">
          Choose your next intelligent learning path
        </h1>
        <p className="text-muted-foreground max-w-2xl leading-6 md:text-lg">
          Premium course tracks with lesson flows, progress indicators, and quizzes built for focused study.
        </p>
      </section>
      <ConvexCoursesSection fallbackCourses={courses} />
      <section className="mt-10 flex flex-col items-center gap-4 rounded-lg border border-white/70 bg-white/60 p-6 text-center shadow-sm backdrop-blur dark:border-white/10 dark:bg-card/60">
        <p className="text-muted-foreground max-w-xl text-sm leading-6">
          Not sure where to begin? Start with AI Study Systems to set up prompts, memory routines, and weekly reviews.
        </p>
        <Button asChild>
          <Link href="/courses/ai-study-systems">Start recommended path</Link>
        </Button>
      </section>
    </PageShell>
  );
}
