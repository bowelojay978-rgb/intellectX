"use client";

import { glassCardClassName } from "@/components/education/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { convexApi } from "@/lib/convex-api";
import { convexEnv } from "@/lib/education-data";
import { cn } from "@/lib/utils";
import { useConvex, useConvexAuth, useMutation } from "convex/react";
import {
  AlertCircleIcon,
  ArchiveIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
  Clock3Icon,
  ExternalLinkIcon,
  FileQuestionIcon,
  SearchIcon,
  SendIcon,
  Undo2Icon,
  XCircleIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type AdminCourseSummary = {
  stableId: string;
  title: string;
  subject: string;
  level: string;
  duration: string;
  instructorId?: string;
  reviewStatus?: string;
  publicationStatus?: string;
  reviewReason?: string;
  lessonCount: number;
  quizCount: number;
  updatedAt: number;
};

type AdminCourseReviewDetail = {
  course: AdminCourseSummary & {
    description: string;
    submittedAt?: number;
    reviewedAt?: number;
  };
  lessons: Array<{
    stableId: string;
    title: string;
    duration: string;
    summary: string;
    content: string[];
    videoUrl?: string | null;
    posterUrl?: string | null;
  }>;
  quizzes: Array<{
    stableId: string;
    title: string;
    difficulty: string;
    estimatedTime: string;
    questions: Array<{
      stableId: string;
      prompt: string;
      choices: string[];
      answerIndex: number;
      explanation: string;
    }>;
  }>;
  auditLogs: Array<{
    _id: unknown;
    eventType: string;
    actorUserId: string;
    actorRole: string;
    createdAt: number;
    reason?: string;
  }>;
};

type QueueFilter = "all" | "submitted" | "changes" | "approved" | "published";

function formatDate(value?: number) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function resolveStatus(course: AdminCourseSummary) {
  if (course.publicationStatus === "published" || course.publicationStatus === "archived") {
    return course.publicationStatus;
  }
  return course.reviewStatus ?? "draft";
}

function matchesFilter(course: AdminCourseSummary, filter: QueueFilter) {
  if (filter === "all") return true;
  if (filter === "submitted") return course.reviewStatus === "submitted_for_review";
  if (filter === "changes") return course.reviewStatus === "changes_requested";
  if (filter === "approved") return course.reviewStatus === "approved" && course.publicationStatus !== "published";
  return course.publicationStatus === "published";
}

export function AdminCourseReviewWorkspace({ initialCourseStableId }: { initialCourseStableId?: string }) {
  if (!convexEnv.isConfigured) {
    return (
      <Card className={`rounded-lg ${glassCardClassName}`}>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Configure NEXT_PUBLIC_CONVEX_URL before using the production admin review workspace.
        </CardContent>
      </Card>
    );
  }

  return <ConvexAdminCourseReviewWorkspace initialCourseStableId={initialCourseStableId} />;
}

function ConvexAdminCourseReviewWorkspace({ initialCourseStableId }: { initialCourseStableId?: string }) {
  const convex = useConvex();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const approveCourse = useMutation(convexApi.courses.approveCourse);
  const requestCourseChanges = useMutation(convexApi.courses.requestCourseChanges);
  const publishCourse = useMutation(convexApi.courses.publishCourse);
  const unpublishCourse = useMutation(convexApi.courses.unpublishCourse);
  const archiveCourse = useMutation(convexApi.courses.archiveCourse);
  const [courses, setCourses] = useState<AdminCourseSummary[]>([]);
  const [selectedStableId, setSelectedStableId] = useState(initialCourseStableId ?? "");
  const [detail, setDetail] = useState<AdminCourseReviewDetail | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<QueueFilter>("submitted");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadCourses = useCallback(async () => {
    if (!isAuthenticated) return [] as AdminCourseSummary[];
    const result = ((await convex.query(convexApi.adminCourses.listAdminCourses, {})) as AdminCourseSummary[]) ?? [];
    setCourses(result);
    return result;
  }, [convex, isAuthenticated]);

  const loadDetail = useCallback(
    async (stableId: string) => {
      if (!isAuthenticated || !stableId) {
        setDetail(null);
        return;
      }

      setDetailLoading(true);
      try {
        const result = await convex.query(convexApi.adminCourses.getAdminCourseReview, { stableId });
        setDetail((result as AdminCourseReviewDetail | null) ?? null);
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : "Unable to load course review details.");
        setDetail(null);
      } finally {
        setDetailLoading(false);
      }
    },
    [convex, isAuthenticated],
  );

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    loadCourses()
      .then((items) => {
        if (cancelled) return;
        const preferred =
          (initialCourseStableId && items.some((course) => course.stableId === initialCourseStableId)
            ? initialCourseStableId
            : "") ||
          items.find((course) => course.reviewStatus === "submitted_for_review")?.stableId ||
          items[0]?.stableId ||
          "";
        setSelectedStableId((current) => current || preferred);
      })
      .catch((caughtError) => {
        if (!cancelled) setError(caughtError instanceof Error ? caughtError.message : "Unable to load admin review queue.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, initialCourseStableId, isAuthenticated, loadCourses]);

  useEffect(() => {
    void loadDetail(selectedStableId);
  }, [loadDetail, selectedStableId]);

  const filteredCourses = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return courses.filter((course) => {
      const searchMatch =
        !normalizedQuery ||
        course.title.toLowerCase().includes(normalizedQuery) ||
        course.subject.toLowerCase().includes(normalizedQuery) ||
        course.stableId.toLowerCase().includes(normalizedQuery) ||
        course.instructorId?.toLowerCase().includes(normalizedQuery);
      return searchMatch && matchesFilter(course, filter);
    });
  }, [courses, filter, query]);

  async function refreshAfterAction(stableId: string) {
    await Promise.all([loadCourses(), loadDetail(stableId)]);
  }

  async function runAction(action: "approve" | "changes" | "publish" | "unpublish" | "archive") {
    if (!detail) return;
    const stableId = detail.course.stableId;
    setBusyAction(action);
    setError(null);
    setNotice(null);

    try {
      if (action === "approve") {
        await approveCourse({ stableId });
        setNotice("Course approved. It remains unpublished until an admin explicitly publishes it.");
      } else if (action === "changes") {
        const normalizedReason = reason.trim();
        if (!normalizedReason) throw new Error("Enter a clear reason before requesting changes.");
        await requestCourseChanges({ stableId, reason: normalizedReason });
        setNotice("Changes requested and recorded in the course workflow audit log.");
        setReason("");
      } else if (action === "publish") {
        await publishCourse({ stableId });
        setNotice("Course published and now eligible for learner visibility under the existing visibility policy.");
      } else if (action === "unpublish") {
        await unpublishCourse({ stableId });
        setNotice("Course unpublished and removed from learner visibility.");
      } else {
        await archiveCourse({ stableId, ...(reason.trim() ? { reason: reason.trim() } : {}) });
        setNotice("Course archived.");
        setReason("");
      }

      await refreshAfterAction(stableId);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to update the course workflow.");
    } finally {
      setBusyAction(null);
    }
  }

  if (authLoading || loading) {
    return (
      <Card className={`rounded-lg ${glassCardClassName}`}>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">Loading authenticated review queue…</CardContent>
      </Card>
    );
  }

  if (!isAuthenticated) {
    return (
      <Card className="rounded-lg border-rose-500/20 bg-rose-500/5">
        <CardContent className="flex items-start gap-3 py-8 text-sm">
          <AlertCircleIcon className="mt-0.5 size-5 shrink-0 text-rose-600" />
          <p>Convex did not authenticate this admin session. Verify Clerk JWT role claim propagation.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {error ? (
        <div className="flex items-start gap-3 rounded-lg border border-rose-500/20 bg-rose-500/5 p-4 text-sm">
          <AlertCircleIcon className="mt-0.5 size-4 shrink-0 text-rose-600" />
          <p>{error}</p>
        </div>
      ) : null}
      {notice ? (
        <div className="flex items-start gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm">
          <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-emerald-600" />
          <p>{notice}</p>
        </div>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card className={`rounded-lg ${glassCardClassName}`}>
          <CardHeader className="space-y-4">
            <div>
              <CardTitle>Course workflow queue</CardTitle>
              <p className="text-muted-foreground mt-2 text-sm">Live Convex data. No preview-only decisions.</p>
            </div>
            <label className="relative block">
              <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search course, subject, or instructor"
                className="border-input bg-background/80 h-10 w-full rounded-lg border pr-3 pl-10 text-sm outline-none transition focus:border-primary/50 focus:ring-3 focus:ring-ring/30"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              {([
                ["submitted", "Submitted"],
                ["changes", "Changes"],
                ["approved", "Approved"],
                ["published", "Published"],
                ["all", "All"],
              ] as const).map(([value, label]) => (
                <Button key={value} type="button" size="sm" variant={filter === value ? "default" : "outline"} onClick={() => setFilter(value)}>
                  {label}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="grid gap-2">
            {filteredCourses.length > 0 ? (
              filteredCourses.map((course) => (
                <button
                  key={course.stableId}
                  type="button"
                  onClick={() => setSelectedStableId(course.stableId)}
                  className={cn(
                    "flex w-full items-start justify-between gap-3 rounded-lg border p-4 text-left transition",
                    selectedStableId === course.stableId
                      ? "border-primary bg-primary/5"
                      : "border-border/70 bg-background/60 hover:bg-secondary/40",
                  )}
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{course.title}</p>
                    <p className="text-muted-foreground mt-1 text-sm">{course.subject}</p>
                    <Badge className="mt-2" variant="outline">{resolveStatus(course).replaceAll("_", " ")}</Badge>
                  </div>
                  <ChevronRightIcon className="text-muted-foreground mt-1 size-4 shrink-0" />
                </button>
              ))
            ) : (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                No courses match this filter.
              </div>
            )}
          </CardContent>
        </Card>

        {detailLoading ? (
          <Card className={`rounded-lg ${glassCardClassName}`}>
            <CardContent className="py-16 text-center text-sm text-muted-foreground">Loading review details…</CardContent>
          </Card>
        ) : detail ? (
          <CourseReviewDetail
            detail={detail}
            reason={reason}
            onReasonChange={setReason}
            busyAction={busyAction}
            onAction={runAction}
          />
        ) : (
          <Card className={`rounded-lg ${glassCardClassName}`}>
            <CardContent className="py-16 text-center text-sm text-muted-foreground">Select a course to review.</CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}

function CourseReviewDetail({
  detail,
  reason,
  onReasonChange,
  busyAction,
  onAction,
}: {
  detail: AdminCourseReviewDetail;
  reason: string;
  onReasonChange: (value: string) => void;
  busyAction: string | null;
  onAction: (action: "approve" | "changes" | "publish" | "unpublish" | "archive") => void;
}) {
  const { course, lessons, quizzes, auditLogs } = detail;
  const submitted = course.reviewStatus === "submitted_for_review";
  const approved = course.reviewStatus === "approved";
  const published = course.publicationStatus === "published";
  const archived = course.publicationStatus === "archived" || course.reviewStatus === "archived";

  return (
    <div className="space-y-5">
      <Card className={`rounded-lg ${glassCardClassName}`}>
        <CardHeader className="gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{resolveStatus(course).replaceAll("_", " ")}</Badge>
            <Badge variant="outline">{lessons.length} lessons</Badge>
            <Badge variant="outline">{quizzes.length} quizzes</Badge>
          </div>
          <div>
            <CardTitle className="text-3xl tracking-tight">{course.title}</CardTitle>
            <p className="text-muted-foreground mt-3 leading-6">{course.description}</p>
          </div>
          <div className="text-muted-foreground flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <span>{course.subject}</span>
            <span>{course.level}</span>
            <span>{course.duration}</span>
            <span>Instructor: {course.instructorId ?? "Unassigned"}</span>
            <span>Submitted: {formatDate(course.submittedAt)}</span>
          </div>
          {course.reviewReason ? (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-sm leading-6">
              <strong>Latest review reason:</strong> {course.reviewReason}
            </div>
          ) : null}
        </CardHeader>
      </Card>

      <section className="grid gap-5 lg:grid-cols-2">
        <Card className={`rounded-lg ${glassCardClassName}`}>
          <CardHeader><CardTitle>Lessons and videos</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {lessons.length > 0 ? lessons.map((lesson, index) => (
              <div key={lesson.stableId} className="rounded-lg border border-border/70 bg-background/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{index + 1}. {lesson.title}</p>
                    <p className="text-muted-foreground mt-1 text-sm leading-6">{lesson.summary}</p>
                  </div>
                  <Badge variant="outline">{lesson.duration}</Badge>
                </div>
                <p className="text-muted-foreground mt-3 text-sm">{lesson.content.filter(Boolean).length} content blocks</p>
                {lesson.videoUrl ? (
                  <a href={lesson.videoUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm font-medium underline underline-offset-4">
                    <ExternalLinkIcon className="size-4" />
                    Open lesson video
                  </a>
                ) : null}
              </div>
            )) : (
              <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">No lessons submitted.</p>
            )}
          </CardContent>
        </Card>

        <Card className={`rounded-lg ${glassCardClassName}`}>
          <CardHeader><CardTitle>Quizzes and questions</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {quizzes.length > 0 ? quizzes.map((quiz) => (
              <div key={quiz.stableId} className="rounded-lg border border-border/70 bg-background/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{quiz.title}</p>
                    <p className="text-muted-foreground mt-1 text-sm">{quiz.difficulty} · {quiz.estimatedTime}</p>
                  </div>
                  <FileQuestionIcon className="text-muted-foreground size-5" />
                </div>
                <p className="text-muted-foreground mt-3 text-sm">{quiz.questions.length} questions</p>
              </div>
            )) : (
              <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">No quizzes submitted.</p>
            )}
          </CardContent>
        </Card>
      </section>

      <Card className={`rounded-lg ${glassCardClassName}`}>
        <CardHeader><CardTitle>Admin decision</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <label className="grid gap-2 text-sm font-medium">
            Review reason or archive note
            <textarea
              value={reason}
              onChange={(event) => onReasonChange(event.target.value)}
              className="border-input bg-background/80 min-h-28 w-full rounded-lg border px-3 py-3 text-sm outline-none transition focus:border-primary/50 focus:ring-3 focus:ring-ring/30"
              placeholder="Required when requesting changes. Optional when archiving."
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={!submitted || busyAction !== null} onClick={() => onAction("approve")}>
              <CheckCircle2Icon className="size-4" />
              {busyAction === "approve" ? "Approving…" : "Approve"}
            </Button>
            <Button type="button" variant="outline" disabled={!submitted || busyAction !== null} onClick={() => onAction("changes")}>
              <XCircleIcon className="size-4" />
              {busyAction === "changes" ? "Requesting…" : "Request changes"}
            </Button>
            <Button type="button" variant="outline" disabled={!approved || published || busyAction !== null} onClick={() => onAction("publish")}>
              <SendIcon className="size-4" />
              {busyAction === "publish" ? "Publishing…" : "Publish"}
            </Button>
            <Button type="button" variant="outline" disabled={!published || busyAction !== null} onClick={() => onAction("unpublish")}>
              <Undo2Icon className="size-4" />
              {busyAction === "unpublish" ? "Unpublishing…" : "Unpublish"}
            </Button>
            <Button type="button" variant="outline" disabled={archived || busyAction !== null} onClick={() => onAction("archive")}>
              <ArchiveIcon className="size-4" />
              {busyAction === "archive" ? "Archiving…" : "Archive"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className={`rounded-lg ${glassCardClassName}`}>
        <CardHeader><CardTitle>Workflow audit history</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {auditLogs.length > 0 ? auditLogs.map((log, index) => (
            <div key={`${String(log._id)}-${index}`} className="flex items-start gap-3 rounded-lg border border-border/70 bg-background/60 p-4">
              <Clock3Icon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
              <div>
                <p className="font-medium">{log.eventType.replaceAll("_", " ")}</p>
                <p className="text-muted-foreground mt-1 text-sm">{log.actorRole} · {formatDate(log.createdAt)}</p>
                {log.reason ? <p className="text-muted-foreground mt-2 text-sm leading-6">{log.reason}</p> : null}
              </div>
            </div>
          )) : (
            <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">No audit events recorded yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
