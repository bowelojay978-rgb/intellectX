"use client";

import { clickableGlassCardClassName, glassCardClassName } from "@/components/education/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  instructorStatusLabels,
  instructorWorkspaceCourses,
  type InstructorCourseStatus,
} from "@/lib/instructor-ui-data";
import { cn } from "@/lib/utils";
import { EyeIcon, FileQuestionIcon, PencilIcon, PlusIcon, SearchIcon } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

type Filter = "all" | InstructorCourseStatus;

const filters: { label: string; value: Filter }[] = [
  { label: "All", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Under review", value: "under_review" },
  { label: "Published", value: "published" },
  { label: "Archived", value: "archived" },
];

function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function InstructorCourseList() {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const visibleCourses = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return instructorWorkspaceCourses.filter((course) => {
      const matchesFilter = filter === "all" || course.status === filter;
      const matchesQuery =
        !normalizedQuery ||
        course.title.toLowerCase().includes(normalizedQuery) ||
        course.subject.toLowerCase().includes(normalizedQuery);

      return matchesFilter && matchesQuery;
    });
  }, [filter, query]);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {filters.map((item) => (
            <Button
              key={item.value}
              type="button"
              size="sm"
              variant={filter === item.value ? "default" : "outline"}
              onClick={() => setFilter(item.value)}
            >
              {item.label}
            </Button>
          ))}
        </div>

        <label className="border-input bg-background/75 flex h-10 w-full items-center gap-2 rounded-lg border px-3 lg:max-w-sm">
          <SearchIcon className="text-muted-foreground size-4" />
          <span className="sr-only">Search courses</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by title or subject"
            className="placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
        </label>
      </section>

      <div className="flex flex-col gap-3 rounded-lg border border-dashed border-primary/20 bg-primary/5 p-4 text-sm leading-6 text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>Frontend workspace preview. Editing works in memory only and does not save to the backend yet.</p>
        <Badge variant="secondary" className="w-fit shrink-0">Frontend only</Badge>
      </div>

      {visibleCourses.length > 0 ? (
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visibleCourses.map((course) => (
            <Card key={course.id} className={`rounded-lg ${glassCardClassName} ${clickableGlassCardClassName}`}>
              <CardHeader className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <Badge variant={course.status === "published" ? "default" : "secondary"}>
                    {instructorStatusLabels[course.status]}
                  </Badge>
                  <span className="text-muted-foreground text-xs">{formatUpdatedAt(course.updatedAt)}</span>
                </div>
                <div>
                  <CardTitle className="text-xl tracking-tight">{course.title}</CardTitle>
                  <p className="text-muted-foreground mt-2 text-sm">{course.subject} · {course.level}</p>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 text-sm">
                <p className="text-muted-foreground line-clamp-3 leading-6">{course.description}</p>
                <div className="grid grid-cols-2 gap-3 rounded-lg bg-secondary/40 p-3">
                  <div>
                    <p className="text-lg font-semibold">{course.lessons.length}</p>
                    <p className="text-muted-foreground text-xs">Lessons</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold">{course.quizzes.length}</p>
                    <p className="text-muted-foreground text-xs">Quizzes</p>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex flex-wrap gap-2">
                <Button size="sm" asChild>
                  <Link href={`/instructor/courses/new?edit=${course.id}`}>
                    <PencilIcon className="size-4" />
                    Edit
                  </Link>
                </Button>
                {course.learnerPreviewAvailable ? (
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/courses/${course.id}`}>
                      <EyeIcon className="size-4" />
                      Preview
                    </Link>
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" disabled>
                    <FileQuestionIcon className="size-4" />
                    No preview yet
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </section>
      ) : (
        <section className={cn("rounded-lg border border-dashed p-8 text-center", glassCardClassName)}>
          <h2 className="text-xl font-semibold tracking-tight">No courses match this view</h2>
          <p className="text-muted-foreground mt-2 text-sm leading-6">
            Clear the search or change the status filter to see other courses.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Button type="button" variant="outline" onClick={() => { setFilter("all"); setQuery(""); }}>
              Clear filters
            </Button>
            <Button asChild>
              <Link href="/instructor/courses/new">
                <PlusIcon className="size-4" />
                Create course
              </Link>
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
