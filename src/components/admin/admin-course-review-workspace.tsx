"use client";

import { glassCardClassName } from "@/components/education/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminCourseReviews, getAdminInstructor, type AdminCourseReview } from "@/lib/admin-ui-data";
import { cn } from "@/lib/utils";
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
  CircleIcon,
  Clock3Icon,
  FileQuestionIcon,
  SearchIcon,
  UserIcon,
  XCircleIcon,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type ReviewFilter = "all" | "high" | "ready" | "blocked";
type ReviewDecision = "approved" | "changes_requested";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function reviewReady(review: AdminCourseReview) {
  return review.checklist.every((item) => item.ready);
}

export function AdminCourseReviewWorkspace() {
  const searchParams = useSearchParams();
  const requestedReviewId = searchParams.get("review");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ReviewFilter>("all");
  const [selectedReviewId, setSelectedReviewId] = useState(requestedReviewId ?? adminCourseReviews[0]?.id ?? "");
  const [reviewerNote, setReviewerNote] = useState("");
  const [decisions, setDecisions] = useState<Record<string, ReviewDecision>>({});
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (requestedReviewId && adminCourseReviews.some((review) => review.id === requestedReviewId)) {
      setSelectedReviewId(requestedReviewId);
    }
  }, [requestedReviewId]);

  const filteredReviews = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return adminCourseReviews.filter((review) => {
      const instructor = getAdminInstructor(review.instructorId);
      const matchesQuery =
        normalizedQuery.length === 0 ||
        review.course.title.toLowerCase().includes(normalizedQuery) ||
        review.course.subject.toLowerCase().includes(normalizedQuery) ||
        instructor?.name.toLowerCase().includes(normalizedQuery);

      if (!matchesQuery) return false;
      if (filter === "high") return review.priority === "high";
      if (filter === "ready") return reviewReady(review);
      if (filter === "blocked") return !reviewReady(review);
      return true;
    });
  }, [filter, query]);

  const selectedReview =
    adminCourseReviews.find((review) => review.id === selectedReviewId) ?? filteredReviews[0] ?? adminCourseReviews[0] ?? null;

  useEffect(() => {
    setReviewerNote(selectedReview?.reviewerNote ?? "");
    setFeedback(null);
  }, [selectedReview?.id, selectedReview?.reviewerNote]);

  function recordDecision(decision: ReviewDecision) {
    if (!selectedReview) return;

    setDecisions((current) => ({ ...current, [selectedReview.id]: decision }));
    setFeedback(
      decision === "approved"
        ? "Approved in this frontend preview. No backend publication or workflow mutation was sent."
        : "Changes requested in this frontend preview. No instructor notification or backend mutation was sent.",
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card className={`rounded-lg ${glassCardClassName}`}>
          <CardHeader className="space-y-4">
            <div>
              <CardTitle>Review queue</CardTitle>
              <p className="text-muted-foreground mt-2 text-sm">Inspect submitted courses and record a frontend-only decision.</p>
            </div>
            <label className="relative block">
              <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search courses or instructors"
                className="border-input bg-background/80 h-10 w-full rounded-lg border pr-3 pl-10 text-sm outline-none transition focus:border-primary/50 focus:ring-3 focus:ring-ring/30"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              {([
                ["all", "All"],
                ["high", "High priority"],
                ["ready", "Ready"],
                ["blocked", "Needs work"],
              ] as const).map(([value, label]) => (
                <Button key={value} type="button" size="sm" variant={filter === value ? "default" : "outline"} onClick={() => setFilter(value)}>
                  {label}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="grid gap-2">
            {filteredReviews.length > 0 ? (
              filteredReviews.map((review) => {
                const instructor = getAdminInstructor(review.instructorId);
                const selected = review.id === selectedReview?.id;
                const decision = decisions[review.id];

                return (
                  <button
                    key={review.id}
                    type="button"
                    onClick={() => setSelectedReviewId(review.id)}
                    className={cn(
                      "flex w-full items-start justify-between gap-3 rounded-lg border p-4 text-left transition",
                      selected ? "border-primary bg-primary/5" : "border-border/70 bg-background/60 hover:bg-secondary/40",
                    )}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-medium">{review.course.title}</p>
                        {review.priority === "high" ? <Badge variant="secondary">High</Badge> : null}
                      </div>
                      <p className="text-muted-foreground mt-1 text-sm">{instructor?.name ?? "Instructor"}</p>
                      {decision ? (
                        <p className={cn("mt-2 text-xs font-medium", decision === "approved" ? "text-emerald-600" : "text-amber-600")}>
                          {decision === "approved" ? "Approved in preview" : "Changes requested in preview"}
                        </p>
                      ) : null}
                    </div>
                    <ChevronRightIcon className="text-muted-foreground mt-1 size-4 shrink-0" />
                  </button>
                );
              })
            ) : (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                No reviews match this search and filter.
              </div>
            )}
          </CardContent>
        </Card>

        {selectedReview ? (
          <ReviewDetail
            review={selectedReview}
            reviewerNote={reviewerNote}
            onReviewerNoteChange={setReviewerNote}
            decision={decisions[selectedReview.id]}
            feedback={feedback}
            onApprove={() => recordDecision("approved")}
            onRequestChanges={() => recordDecision("changes_requested")}
          />
        ) : (
          <Card className={`rounded-lg ${glassCardClassName}`}>
            <CardContent className="py-16 text-center text-sm text-muted-foreground">No course review is available.</CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}

type ReviewDetailProps = {
  review: AdminCourseReview;
  reviewerNote: string;
  onReviewerNoteChange: (value: string) => void;
  decision?: ReviewDecision;
  feedback: string | null;
  onApprove: () => void;
  onRequestChanges: () => void;
};

function ReviewDetail({
  review,
  reviewerNote,
  onReviewerNoteChange,
  decision,
  feedback,
  onApprove,
  onRequestChanges,
}: ReviewDetailProps) {
  const instructor = getAdminInstructor(review.instructorId);
  const completeChecks = review.checklist.filter((item) => item.ready).length;
  const ready = reviewReady(review);

  return (
    <div className="grid gap-5">
      <Card className={`rounded-lg ${glassCardClassName}`}>
        <CardHeader className="gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Under review</Badge>
            {review.priority === "high" ? <Badge variant="outline">High priority</Badge> : null}
            {decision ? <Badge variant="outline">{decision === "approved" ? "Approved in preview" : "Changes requested in preview"}</Badge> : null}
          </div>
          <div>
            <CardTitle className="text-3xl tracking-tight">{review.course.title}</CardTitle>
            <p className="text-muted-foreground mt-3 max-w-3xl leading-6">{review.course.description}</p>
          </div>
          <div className="text-muted-foreground flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <span className="inline-flex items-center gap-2">
              <UserIcon className="size-4" />
              {instructor?.name ?? "Instructor"}
            </span>
            <span className="inline-flex items-center gap-2">
              <Clock3Icon className="size-4" />
              Submitted {formatDate(review.submittedAt)}
            </span>
            <span>{review.course.subject}</span>
            <span>{review.course.level}</span>
            <span>{review.course.duration}</span>
          </div>
        </CardHeader>
      </Card>

      <section className="grid gap-5 lg:grid-cols-2">
        <Card className={`rounded-lg ${glassCardClassName}`}>
          <CardHeader>
            <CardTitle>Lessons</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {review.course.lessons.length > 0 ? (
              review.course.lessons.map((lesson, index) => (
                <div key={lesson.id} className="rounded-lg border border-border/70 bg-background/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{index + 1}. {lesson.title}</p>
                      <p className="text-muted-foreground mt-1 text-sm leading-6">{lesson.summary}</p>
                    </div>
                    <Badge variant="outline">{lesson.duration}</Badge>
                  </div>
                  <p className="text-muted-foreground mt-3 line-clamp-3 text-sm leading-6">{lesson.content}</p>
                </div>
              ))
            ) : (
              <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">No lessons were submitted.</p>
            )}
          </CardContent>
        </Card>

        <Card className={`rounded-lg ${glassCardClassName}`}>
          <CardHeader>
            <CardTitle>Quizzes</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {review.course.quizzes.length > 0 ? (
              review.course.quizzes.map((quiz) => (
                <div key={quiz.id} className="rounded-lg border border-border/70 bg-background/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{quiz.title}</p>
                      <p className="text-muted-foreground mt-1 text-sm">{quiz.questions.length} questions · {quiz.estimatedTime}</p>
                    </div>
                    <FileQuestionIcon className="text-muted-foreground size-5" />
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 p-4 text-sm leading-6">
                <div className="flex items-start gap-3">
                  <AlertCircleIcon className="mt-0.5 size-4 shrink-0 text-amber-600" />
                  <p>No quiz or knowledge check is included in this submission.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <Card className={`rounded-lg ${glassCardClassName}`}>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Readiness checklist</CardTitle>
            <p className="text-muted-foreground mt-2 text-sm">{completeChecks} of {review.checklist.length} checks ready.</p>
          </div>
          <Badge variant={ready ? "secondary" : "outline"}>{ready ? "Ready" : "Needs work"}</Badge>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {review.checklist.map((item) => (
            <div key={item.label} className="flex items-start gap-3 rounded-lg bg-secondary/35 p-4 text-sm">
              {item.ready ? (
                <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-emerald-600" />
              ) : (
                <CircleIcon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
              )}
              <span>{item.label}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className={`rounded-lg ${glassCardClassName}`}>
        <CardHeader>
          <CardTitle>Admin decision</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="grid gap-2 text-sm font-medium">
            Reviewer note
            <textarea
              value={reviewerNote}
              onChange={(event) => onReviewerNoteChange(event.target.value)}
              rows={5}
              placeholder="Add feedback for the instructor"
              className="border-input bg-background/80 min-h-32 rounded-lg border px-4 py-3 text-sm leading-6 outline-none transition focus:border-primary/50 focus:ring-3 focus:ring-ring/30"
            />
          </label>
          <div className="rounded-lg border border-dashed border-primary/25 bg-primary/5 p-4 text-sm leading-6 text-muted-foreground">
            Frontend-only preview: these buttons update this page in memory only. They do not publish a course, change workflow state, or notify an instructor.
          </div>
          {feedback ? (
            <div className="rounded-lg border border-border/70 bg-secondary/35 p-4 text-sm leading-6" aria-live="polite">
              {feedback}
            </div>
          ) : null}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="button" onClick={onApprove}>
              <CheckCircle2Icon className="size-4" />
              Approve course
            </Button>
            <Button type="button" variant="outline" onClick={onRequestChanges}>
              <XCircleIcon className="size-4" />
              Request changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
