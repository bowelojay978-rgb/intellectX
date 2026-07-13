"use client";

import { AppLoadingSpinner } from "@/components/ui/app-loading-spinner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { searchLearnerCatalog } from "@/lib/catalog-search";
import { useLearnerCatalog } from "@/lib/learner-catalog-client";
import { BookOpenIcon, FileQuestionIcon, SearchIcon, TextIcon } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

export function CatalogSearch() {
  const catalog = useLearnerCatalog();
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const results = useMemo(() => searchLearnerCatalog(catalog, normalizedQuery), [catalog, normalizedQuery]);
  const resultCount = results.courses.length + results.lessons.length + results.quizzes.length;

  return (
    <section className="mx-auto max-w-5xl space-y-8">
      <div className="mx-auto max-w-2xl text-center">
        <Badge variant="secondary" className="mb-4 uppercase">Search</Badge>
        <h1 className="text-4xl font-medium tracking-tight md:text-6xl">Find your next learning step</h1>
        <p className="text-muted-foreground mt-4 leading-7">
          Search learner-visible courses, lessons, and quizzes from one place.
        </p>
      </div>

      <label className="border-border bg-background/80 mx-auto flex max-w-2xl items-center gap-3 rounded-xl border px-4 shadow-sm">
        <SearchIcon className="text-muted-foreground size-5 shrink-0" />
        <span className="sr-only">Search courses, lessons, and quizzes</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Try a course, topic, lesson, or quiz"
          className="h-14 w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
          autoFocus
        />
      </label>

      {catalog.isLoading ? (
        <div className="flex min-h-48 items-center justify-center">
          <AppLoadingSpinner label="Loading searchable catalog" showLabel />
        </div>
      ) : !normalizedQuery ? (
        <SearchMessage title="Start typing to search" description="Results update as you type." />
      ) : resultCount === 0 ? (
        <SearchMessage title="No matching learning content" description="Try a broader subject, course title, or lesson topic." />
      ) : (
        <div className="space-y-8" aria-live="polite">
          <p className="text-muted-foreground text-sm">{resultCount} result{resultCount === 1 ? "" : "s"}</p>
          <SearchResultGroup title="Courses" items={results.courses.map((course) => ({
            id: course.id,
            href: `/courses/${course.id}`,
            title: course.title,
            description: `${course.subject} · ${course.level} · ${course.duration}`,
          }))} icon={BookOpenIcon} />
          <SearchResultGroup title="Lessons" items={results.lessons.map((lesson) => ({
            id: lesson.id,
            href: `/learn/${lesson.id}`,
            title: lesson.title,
            description: `${catalog.courseById.get(lesson.courseId)?.title ?? "Course"} · ${lesson.duration}`,
          }))} icon={TextIcon} />
          <SearchResultGroup title="Quizzes" items={results.quizzes.map((quiz) => ({
            id: quiz.id,
            href: `/quiz/${quiz.id}`,
            title: quiz.title,
            description: `${catalog.courseById.get(quiz.courseId)?.title ?? "Course"} · ${quiz.questions.length} questions`,
          }))} icon={FileQuestionIcon} />
        </div>
      )}
    </section>
  );
}

function SearchMessage({ title, description }: { title: string; description: string }) {
  return (
    <div className="border-border/70 bg-background/60 mx-auto max-w-2xl rounded-xl border border-dashed px-6 py-12 text-center">
      <p className="font-medium">{title}</p>
      <p className="text-muted-foreground mt-2 text-sm">{description}</p>
    </div>
  );
}

function SearchResultGroup({
  title,
  items,
  icon: Icon,
}: {
  title: string;
  items: Array<{ id: string; href: string; title: string; description: string }>;
  icon: typeof BookOpenIcon;
}) {
  if (items.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <Link key={item.id} href={item.href} className="group block">
            <Card className="h-full rounded-xl transition-transform group-hover:-translate-y-0.5">
              <CardHeader className="flex-row items-center gap-3">
                <span className="bg-primary/10 text-primary grid size-10 place-items-center rounded-full">
                  <Icon className="size-5" />
                </span>
                <CardTitle className="text-lg">{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm">{item.description}</CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
