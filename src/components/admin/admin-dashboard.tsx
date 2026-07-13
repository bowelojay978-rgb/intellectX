"use client";

import { glassCardClassName } from "@/components/education/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { convexApi } from "@/lib/convex-api";
import { convexEnv } from "@/lib/education-data";
import { useConvex, useConvexAuth } from "convex/react";
import { AlertCircleIcon, BookOpenCheckIcon, Clock3Icon, GraduationCapIcon, SendIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type AdminCourseSummary = {
  stableId: string;
  title: string;
  subject: string;
  reviewStatus?: string;
  publicationStatus?: string;
  lessonCount: number;
  quizCount: number;
  updatedAt: number;
};

function resolveStatus(course: AdminCourseSummary) {
  if (course.publicationStatus === "published" || course.publicationStatus === "archived") {
    return course.publicationStatus;
  }
  return course.reviewStatus ?? "draft";
}

function formatDate(value: number) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function AdminDashboard() {
  if (!convexEnv.isConfigured) {
    return (
      <Card className={`rounded-lg ${glassCardClassName}`}>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Configure NEXT_PUBLIC_CONVEX_URL before using the production admin workspace.
        </CardContent>
      </Card>
    );
  }

  return <ConvexAdminDashboard />;
}

function ConvexAdminDashboard() {
  const convex = useConvex();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const [courses, setCourses] = useState<AdminCourseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    convex
      .query(convexApi.adminCourses.listAdminCourses, {})
      .then((result) => {
        if (!cancelled) setCourses((result as AdminCourseSummary[]) ?? []);
      })
      .catch((caughtError) => {
        if (!cancelled) setError(caughtError instanceof Error ? caughtError.message : "Unable to load admin courses.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [convex, isAuthenticated, isLoading]);

  const metrics = useMemo(() => {
    const reviewQueue = courses.filter((course) => course.reviewStatus === "submitted_for_review").length;
    const changesRequested = courses.filter((course) => course.reviewStatus === "changes_requested").length;
    const published = courses.filter((course) => course.publicationStatus === "published").length;
    return { reviewQueue, changesRequested, published };
  }, [courses]);

  if (isLoading || loading) {
    return (
      <Card className={`rounded-lg ${glassCardClassName}`}>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">Loading admin workflow data…</CardContent>
      </Card>
    );
  }

  if (!isAuthenticated) {
    return (
      <Card className="rounded-lg border-rose-500/20 bg-rose-500/5">
        <CardContent className="flex items-start gap-3 py-8 text-sm">
          <AlertCircleIcon className="mt-0.5 size-5 shrink-0 text-rose-600" />
          <p>Convex did not authenticate this admin session. Verify Clerk JWT role claim propagation before using staff mutations.</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="rounded-lg border-rose-500/20 bg-rose-500/5">
        <CardContent className="flex items-start gap-3 py-8 text-sm">
          <AlertCircleIcon className="mt-0.5 size-5 shrink-0 text-rose-600" />
          <p>{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Awaiting review" value={metrics.reviewQueue} icon={<BookOpenCheckIcon className="size-5" />} />
        <MetricCard label="Changes requested" value={metrics.changesRequested} icon={<Clock3Icon className="size-5" />} />
        <MetricCard label="Published courses" value={metrics.published} icon={<GraduationCapIcon className="size-5" />} />
      </section>

      <Card className={`rounded-lg ${glassCardClassName}`}>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Recent course workflow</CardTitle>
            <p className="text-muted-foreground mt-2 text-sm">Live Convex-backed course states, newest activity first.</p>
          </div>
          <Button asChild>
            <Link href="/admin/course-review">
              <SendIcon className="size-4" />
              Open review queue
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {courses.length > 0 ? (
            courses.slice(0, 8).map((course) => (
              <div key={course.stableId} className="flex flex-col gap-3 rounded-lg border border-border/70 bg-background/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{course.title}</p>
                    <Badge variant="outline">{resolveStatus(course).replaceAll("_", " ")}</Badge>
                  </div>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {course.subject} · {course.lessonCount} lessons · {course.quizCount} quizzes · Updated {formatDate(course.updatedAt)}
                  </p>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/admin/course-review?course=${encodeURIComponent(course.stableId)}`}>Review</Link>
                </Button>
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              No course workflow records are available yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <Card className={`rounded-lg ${glassCardClassName}`}>
      <CardContent className="flex items-center justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-sm">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
        </div>
        <div className="bg-secondary/60 rounded-lg p-3">{icon}</div>
      </CardContent>
    </Card>
  );
}
