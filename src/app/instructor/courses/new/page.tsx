import { StaffRouteGuard } from "@/components/auth/staff-route-guard";
import { PageShell } from "@/components/education/page-shell";
import { InstructorCourseBuilder } from "@/components/instructor/instructor-course-builder";
import { InstructorWorkspaceNav } from "@/components/instructor/instructor-workspace-nav";
import { Badge } from "@/components/ui/badge";
import { getInstructorWorkspaceCourse } from "@/lib/instructor-ui-data";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Course Builder - IntellectX",
  description: "Create and edit IntellectX course, lesson, and quiz frontend drafts.",
};

type InstructorCourseBuilderPageProps = {
  searchParams: Promise<{ edit?: string }>;
};

export default async function InstructorNewCoursePage({ searchParams }: InstructorCourseBuilderPageProps) {
  const { edit } = await searchParams;
  const initialCourse = edit ? getInstructorWorkspaceCourse(edit) : null;

  return (
    <StaffRouteGuard pathname="/instructor/courses/new">
      <PageShell>
        <InstructorWorkspaceNav />
        <section className="mb-8 flex flex-col gap-4">
          <Badge variant="secondary" className="w-fit uppercase">
            {initialCourse ? "Edit course" : "Create course"}
          </Badge>
          <h1 className="max-w-4xl text-4xl leading-[1.1] font-medium tracking-tight md:text-6xl">
            {initialCourse ? `Continue building ${initialCourse.title}` : "Build a new learning path"}
          </h1>
          <p className="text-muted-foreground max-w-2xl leading-7 md:text-lg">
            Move from course details to lessons, quizzes, and a final frontend review without touching backend persistence.
          </p>
        </section>
        <InstructorCourseBuilder initialCourse={initialCourse} />
      </PageShell>
    </StaffRouteGuard>
  );
}
