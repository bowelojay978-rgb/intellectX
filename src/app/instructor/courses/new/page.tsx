import { StaffRouteGuard } from "@/components/auth/staff-route-guard";
import { PageShell } from "@/components/education/page-shell";
import { InstructorCourseBuilder } from "@/components/instructor/instructor-course-builder";
import { InstructorWorkspaceNav } from "@/components/instructor/instructor-workspace-nav";
import { Badge } from "@/components/ui/badge";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Course Builder - IntellectX",
  description: "Create and edit authenticated instructor course drafts, lessons, quizzes, and questions.",
};

type InstructorCourseBuilderPageProps = {
  searchParams: Promise<{ edit?: string }>;
};

export default async function InstructorNewCoursePage({ searchParams }: InstructorCourseBuilderPageProps) {
  const { edit } = await searchParams;

  return (
    <StaffRouteGuard pathname="/instructor/courses/new">
      <PageShell>
        <InstructorWorkspaceNav />
        <section className="mb-8 flex flex-col gap-4">
          <Badge variant="secondary" className="w-fit uppercase">
            {edit ? "Edit course" : "Create course"}
          </Badge>
          <h1 className="max-w-4xl text-4xl leading-[1.1] font-medium tracking-tight md:text-6xl">
            {edit ? "Continue building your course" : "Build a new learning path"}
          </h1>
          <p className="text-muted-foreground max-w-2xl leading-7 md:text-lg">
            Course details, lessons, quizzes, questions, draft persistence, workflow state, and review submission are backed by authenticated Convex operations.
          </p>
        </section>
        <InstructorCourseBuilder editStableId={edit} />
      </PageShell>
    </StaffRouteGuard>
  );
}
