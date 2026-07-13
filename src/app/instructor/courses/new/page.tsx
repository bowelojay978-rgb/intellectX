import { StaffRouteGuard } from "@/components/auth/staff-route-guard";
import { PageShell } from "@/components/education/page-shell";
import { InstructorCourseBuilder } from "@/components/instructor/instructor-course-builder";
import { InstructorLessonMediaManager } from "@/components/instructor/instructor-lesson-media-manager";
import { InstructorWorkspaceNav } from "@/components/instructor/instructor-workspace-nav";
import { Badge } from "@/components/ui/badge";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Course Builder - IntellectX",
  description: "Create and edit authenticated instructor course drafts, lessons, quizzes, questions, and lesson media.",
};

type InstructorCourseBuilderPageProps = {
  searchParams: Promise<{ edit?: string; readonly?: string }>;
};

export default async function InstructorNewCoursePage({ searchParams }: InstructorCourseBuilderPageProps) {
  const { edit, readonly } = await searchParams;
  const readOnly = readonly === "1" || readonly === "true";

  return (
    <StaffRouteGuard pathname="/instructor/courses/new">
      <PageShell>
        <InstructorWorkspaceNav />
        <section className="mb-8 flex flex-col gap-4">
          <Badge variant="secondary" className="w-fit uppercase">
            {edit ? (readOnly ? "View course" : "Edit course") : "Create course"}
          </Badge>
          <h1 className="max-w-4xl text-4xl leading-[1.1] font-medium tracking-tight md:text-6xl">
            {edit ? (readOnly ? "Review your course" : "Continue building your course") : "Build a new learning path"}
          </h1>
          <p className="text-muted-foreground max-w-2xl leading-7 md:text-lg">
            Course details, lessons, quizzes, questions, authenticated file uploads, draft persistence, workflow state, and review submission are backed by server-authorized Convex operations.
          </p>
        </section>
        <div className="space-y-6">
          <InstructorCourseBuilder editStableId={edit} />
          {edit ? <InstructorLessonMediaManager courseStableId={edit} readOnly={readOnly} /> : null}
        </div>
      </PageShell>
    </StaffRouteGuard>
  );
}
