import { StaffRouteGuard } from "@/components/auth/staff-route-guard";
import { PageShell } from "@/components/education/page-shell";
import { InstructorCourseList } from "@/components/instructor/instructor-course-list";
import { InstructorWorkspaceNav } from "@/components/instructor/instructor-workspace-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Instructor Courses - IntellectX",
  description: "Manage instructor course drafts, review states, and learner previews in IntellectX.",
};

export default function InstructorCoursesPage() {
  return (
    <StaffRouteGuard pathname="/instructor/courses">
      <PageShell>
        <InstructorWorkspaceNav />
        <section className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge variant="secondary" className="mb-4 w-fit uppercase">
              Course management
            </Badge>
            <h1 className="max-w-4xl text-4xl leading-[1.1] font-medium tracking-tight md:text-6xl">
              Manage your courses
            </h1>
            <p className="text-muted-foreground mt-4 max-w-2xl leading-7 md:text-lg">
              Filter by workflow status, continue editing, or preview published learner-facing courses.
            </p>
          </div>
          <Button size="lg" asChild>
            <Link href="/instructor/courses/new">
              <PlusIcon className="size-4" />
              Create course
            </Link>
          </Button>
        </section>
        <InstructorCourseList />
      </PageShell>
    </StaffRouteGuard>
  );
}
