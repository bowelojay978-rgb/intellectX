"use client";

import { glassCardClassName } from "@/components/education/glass-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { convexApi } from "@/lib/convex-api";
import { convexEnv } from "@/lib/education-data";
import {
  type InstructorCourseDraft,
  type InstructorLessonDraft,
  type InstructorQuizDraft,
  type InstructorQuizQuestionDraft,
  createBlankInstructorCourseDraft,
  createInstructorStableId,
  instructorCourseLevels,
  instructorCourseStatusLabels,
  instructorCourseStatusTone,
  instructorQuizDifficulties,
  isInstructorCourseEditable,
  resolveInstructorCourseStatus,
  slugifyInstructorCourseTitle,
} from "@/lib/instructor-course-workspace";
import { useConvex, useConvexAuth, useMutation } from "convex/react";
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  FileQuestionIcon,
  Layers3Icon,
  PlusIcon,
  RefreshCcwIcon,
  SaveIcon,
  SendIcon,
  Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const fieldClassName =
  "border-input bg-background/80 h-11 w-full rounded-lg border px-3 text-sm outline-none transition focus:border-primary/50 focus:ring-ring/30 focus:ring-[3px] disabled:cursor-not-allowed disabled:opacity-60";
const textareaClassName =
  "border-input bg-background/80 min-h-28 w-full resize-y rounded-lg border px-3 py-3 text-sm leading-6 outline-none transition focus:border-primary/50 focus:ring-ring/30 focus:ring-[3px] disabled:cursor-not-allowed disabled:opacity-60";

type RemoteInstructorCourseDraft = {
  course: Omit<InstructorCourseDraft, "lessons" | "quizzes">;
  lessons: InstructorLessonDraft[];
  quizzes: InstructorQuizDraft[];
};

type SaveInstructorCourseDraftResult = {
  courseId: unknown;
  updatedAt: number;
};

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      <span>{label}</span>
      {children}
    </label>
  );
}

function createLesson(): InstructorLessonDraft {
  return {
    stableId: createInstructorStableId("lesson"),
    title: "",
    duration: "",
    summary: "",
    content: [],
    videoUrl: "",
  };
}

function createQuestion(): InstructorQuizQuestionDraft {
  return {
    stableId: createInstructorStableId("question"),
    prompt: "",
    choices: ["", "", "", ""],
    answerIndex: 0,
    explanation: "",
  };
}

function createQuiz(): InstructorQuizDraft {
  return {
    stableId: createInstructorStableId("quiz"),
    title: "",
    difficulty: "Foundational",
    estimatedTime: "5 min",
    questions: [],
  };
}

function getDraftReadinessIssues(course: InstructorCourseDraft) {
  const issues: string[] = [];

  if (!course.title.trim() || !course.description.trim() || !course.subject.trim() || !course.level.trim() || !course.duration.trim()) {
    issues.push("Complete the required course details.");
  }

  if (course.lessons.length === 0) {
    issues.push("Add at least one lesson.");
  }

  course.lessons.forEach((lesson, index) => {
    if (!lesson.title.trim() || !lesson.duration.trim() || !lesson.summary.trim() || lesson.content.every((block) => !block.trim())) {
      issues.push(`Complete lesson ${index + 1}: title, duration, summary, and content are required.`);
    }
  });

  course.quizzes.forEach((quiz, quizIndex) => {
    if (!quiz.title.trim()) {
      issues.push(`Add a title to quiz ${quizIndex + 1}.`);
    }

    if (quiz.questions.length === 0) {
      issues.push(`Add at least one question to quiz ${quizIndex + 1}.`);
    }

    quiz.questions.forEach((question, questionIndex) => {
      const choicesComplete = question.choices.length >= 2 && question.choices.every((choice) => Boolean(choice.trim()));
      const correctChoice = question.choices[question.answerIndex];

      if (!question.prompt.trim() || !question.explanation.trim() || !choicesComplete || !correctChoice?.trim()) {
        issues.push(`Complete question ${questionIndex + 1} in quiz ${quizIndex + 1}.`);
      }
    });
  });

  return issues;
}

function mapRemoteDraft(remote: RemoteInstructorCourseDraft): InstructorCourseDraft {
  return {
    ...remote.course,
    lessons: remote.lessons.map((lesson) => ({
      stableId: lesson.stableId,
      title: lesson.title,
      duration: lesson.duration,
      summary: lesson.summary,
      content: [...lesson.content],
      videoUrl: lesson.videoUrl ?? "",
      posterUrl: lesson.posterUrl,
    })),
    quizzes: remote.quizzes.map((quiz) => ({
      stableId: quiz.stableId,
      lessonStableId: quiz.lessonStableId,
      title: quiz.title,
      difficulty: quiz.difficulty,
      estimatedTime: quiz.estimatedTime,
      questions: quiz.questions.map((question) => ({
        stableId: question.stableId,
        prompt: question.prompt,
        choices: [...question.choices],
        answerIndex: question.answerIndex,
        explanation: question.explanation,
      })),
    })),
  };
}

export function InstructorCourseBuilder({ editStableId }: { editStableId?: string }) {
  if (!convexEnv.isConfigured) {
    return (
      <Card className={`rounded-lg ${glassCardClassName}`}>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Configure NEXT_PUBLIC_CONVEX_URL before using the production instructor course builder.
        </CardContent>
      </Card>
    );
  }

  return <ConvexInstructorCourseBuilder editStableId={editStableId} />;
}

function ConvexInstructorCourseBuilder({ editStableId }: { editStableId?: string }) {
  const convex = useConvex();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const saveInstructorCourseDraft = useMutation(convexApi.courses.saveInstructorCourseDraft);
  const submitCourseForReview = useMutation(convexApi.courses.submitCourseForReview);
  const router = useRouter();
  const [course, setCourse] = useState<InstructorCourseDraft>(() => createBlankInstructorCourseDraft());
  const [persistedStableId, setPersistedStableId] = useState<string | undefined>(editStableId);
  const [loading, setLoading] = useState(Boolean(editStableId));
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [slugTouched, setSlugTouched] = useState(Boolean(editStableId));
  const readinessIssues = useMemo(() => getDraftReadinessIssues(course), [course]);
  const status = resolveInstructorCourseStatus(course);
  const editable = !persistedStableId || isInstructorCourseEditable(course);

  useEffect(() => {
    if (!editStableId || authLoading || !isAuthenticated) {
      if (!editStableId && !authLoading) {
        setLoading(false);
      }
      return;
    }

    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    convex
      .query(convexApi.courses.getInstructorCourseDraft, { stableId: editStableId })
      .then((result) => {
        if (cancelled) return;
        const remote = result as RemoteInstructorCourseDraft | null;

        if (!remote) {
          throw new Error("Course not found or unavailable to this instructor account.");
        }

        setCourse(mapRemoteDraft(remote));
        setPersistedStableId(remote.course.stableId);
        setSlugTouched(true);
      })
      .catch((caughtError) => {
        if (cancelled) return;
        setLoadError(caughtError instanceof Error ? caughtError.message : "Unable to load course draft.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, convex, editStableId, isAuthenticated]);

  function updateCourse<K extends keyof InstructorCourseDraft>(key: K, value: InstructorCourseDraft[K]) {
    setCourse((current) => ({ ...current, [key]: value }));
    setError(null);
    setNotice(null);
  }

  function updateLesson(lessonId: string, patch: Partial<InstructorLessonDraft>) {
    setCourse((current) => ({
      ...current,
      lessons: current.lessons.map((lesson) => (lesson.stableId === lessonId ? { ...lesson, ...patch } : lesson)),
    }));
    setError(null);
    setNotice(null);
  }

  function updateQuiz(quizId: string, patch: Partial<InstructorQuizDraft>) {
    setCourse((current) => ({
      ...current,
      quizzes: current.quizzes.map((quiz) => (quiz.stableId === quizId ? { ...quiz, ...patch } : quiz)),
    }));
    setError(null);
    setNotice(null);
  }

  function updateQuestion(quizId: string, questionId: string, patch: Partial<InstructorQuizQuestionDraft>) {
    setCourse((current) => ({
      ...current,
      quizzes: current.quizzes.map((quiz) =>
        quiz.stableId === quizId
          ? {
              ...quiz,
              questions: quiz.questions.map((question) =>
                question.stableId === questionId ? { ...question, ...patch } : question,
              ),
            }
          : quiz,
      ),
    }));
    setError(null);
    setNotice(null);
  }

  function buildPayload() {
    const slug = course.slug.trim() || slugifyInstructorCourseTitle(course.title);

    if (!slug) {
      throw new Error("Course slug is required.");
    }

    return {
      existingStableId: persistedStableId,
      expectedUpdatedAt: persistedStableId ? course.updatedAt : undefined,
      stableId: course.stableId,
      slug,
      title: course.title,
      description: course.description,
      subject: course.subject,
      level: course.level,
      duration: course.duration,
      accent: course.accent,
      lessons: course.lessons.map((lesson) => ({
        stableId: lesson.stableId,
        title: lesson.title,
        duration: lesson.duration,
        summary: lesson.summary,
        content: lesson.content,
        ...(lesson.videoUrl?.trim() ? { videoUrl: lesson.videoUrl.trim() } : {}),
        ...(lesson.posterUrl?.trim() ? { posterUrl: lesson.posterUrl.trim() } : {}),
      })),
      quizzes: course.quizzes.map((quiz) => ({
        stableId: quiz.stableId,
        ...(quiz.lessonStableId ? { lessonStableId: quiz.lessonStableId } : {}),
        title: quiz.title,
        difficulty: quiz.difficulty,
        estimatedTime: quiz.estimatedTime,
        questions: quiz.questions.map((question) => ({
          stableId: question.stableId,
          prompt: question.prompt,
          choices: question.choices,
          answerIndex: question.answerIndex,
          explanation: question.explanation,
        })),
      })),
    };
  }

  async function saveDraft(submitAfterSave = false) {
    if (!editable) {
      setError("This course is read-only in its current workflow state.");
      return;
    }

    setSaving(true);
    setError(null);
    setNotice(null);

    let payload: ReturnType<typeof buildPayload>;

    try {
      payload = buildPayload();
      const result = (await saveInstructorCourseDraft(payload)) as SaveInstructorCourseDraftResult;
      setPersistedStableId(payload.stableId);
      setCourse((current) => ({ ...current, slug: payload.slug, updatedAt: result.updatedAt }));

      if (!persistedStableId) {
        router.replace(`/instructor/courses/new?edit=${encodeURIComponent(payload.stableId)}`);
      }

      if (submitAfterSave) {
        await submitCourseForReview({ stableId: payload.stableId });
        router.push("/instructor/courses");
        router.refresh();
        return;
      }

      setNotice("Draft saved to Convex.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to save instructor course draft.");
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || loading) {
    return (
      <Card className={`rounded-lg ${glassCardClassName}`}>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">Loading authenticated course workspace…</CardContent>
      </Card>
    );
  }

  if (!isAuthenticated) {
    return (
      <Card className="rounded-lg border-rose-500/20 bg-rose-500/5">
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <AlertCircleIcon className="size-7 text-rose-600" />
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Authenticated Convex staff identity required</h2>
            <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
              The instructor route was reached, but Convex has not authenticated this staff session. Confirm the Clerk JWT template and trusted role claim propagation.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loadError) {
    return (
      <Card className="rounded-lg border-rose-500/20 bg-rose-500/5">
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <AlertCircleIcon className="size-7 text-rose-600" />
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Unable to load course draft</h2>
            <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">{loadError}</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/instructor/courses">
              <RefreshCcwIcon className="size-4" />
              Back to courses
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-lg border border-dashed border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium">Workflow status</p>
          <p className="text-muted-foreground mt-1 text-sm">
            {editable
              ? "This course can be edited and saved. Submission is validated again on the server."
              : "This course is read-only until the workflow returns it to an editable state."}
          </p>
        </div>
        <span className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${instructorCourseStatusTone[status]}`}>
          {instructorCourseStatusLabels[status]}
        </span>
      </section>

      {status === "changes_requested" && course.reviewReason ? (
        <Card className="rounded-lg border-rose-500/20 bg-rose-500/5">
          <CardHeader>
            <CardTitle className="text-lg">Admin changes requested</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm leading-6">{course.reviewReason}</CardContent>
        </Card>
      ) : null}

      {error ? (
        <div className="flex items-start gap-3 rounded-lg border border-rose-500/20 bg-rose-500/5 p-4 text-sm leading-6">
          <AlertCircleIcon className="mt-0.5 size-5 shrink-0 text-rose-600" />
          <p>{error}</p>
        </div>
      ) : null}

      {notice ? (
        <div className="flex items-start gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm leading-6">
          <CheckCircle2Icon className="mt-0.5 size-5 shrink-0 text-emerald-600" />
          <p>{notice}</p>
        </div>
      ) : null}

      <Card className={`rounded-lg ${glassCardClassName}`}>
        <CardHeader>
          <CardTitle>Course details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <FieldLabel label="Course title">
            <input
              value={course.title}
              disabled={!editable}
              onChange={(event) => {
                const title = event.target.value;
                setCourse((current) => ({
                  ...current,
                  title,
                  slug: slugTouched ? current.slug : slugifyInstructorCourseTitle(title),
                }));
                setError(null);
                setNotice(null);
              }}
              className={fieldClassName}
              placeholder="e.g. CIE A-Level Biology"
            />
          </FieldLabel>
          <FieldLabel label="URL slug">
            <input
              value={course.slug}
              disabled={!editable}
              onChange={(event) => {
                setSlugTouched(true);
                updateCourse("slug", slugifyInstructorCourseTitle(event.target.value));
              }}
              className={fieldClassName}
              placeholder="cie-a-level-biology"
            />
          </FieldLabel>
          <FieldLabel label="Subject">
            <input
              value={course.subject}
              disabled={!editable}
              onChange={(event) => updateCourse("subject", event.target.value)}
              className={fieldClassName}
              placeholder="Biology"
            />
          </FieldLabel>
          <FieldLabel label="Level">
            <select
              value={course.level}
              disabled={!editable}
              onChange={(event) => updateCourse("level", event.target.value)}
              className={fieldClassName}
            >
              <option value="">Select level</option>
              {instructorCourseLevels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </FieldLabel>
          <FieldLabel label="Duration">
            <input
              value={course.duration}
              disabled={!editable}
              onChange={(event) => updateCourse("duration", event.target.value)}
              className={fieldClassName}
              placeholder="12 weeks"
            />
          </FieldLabel>
          <FieldLabel label="Course identifier">
            <input value={course.stableId} disabled className={fieldClassName} />
          </FieldLabel>
          <div className="md:col-span-2">
            <FieldLabel label="Description">
              <textarea
                value={course.description}
                disabled={!editable}
                onChange={(event) => updateCourse("description", event.target.value)}
                className={textareaClassName}
                placeholder="Describe the course outcomes and learner scope."
              />
            </FieldLabel>
          </div>
        </CardContent>
      </Card>

      <Card className={`rounded-lg ${glassCardClassName}`}>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Lessons</CardTitle>
            <p className="text-muted-foreground mt-2 text-sm">At least one complete lesson is required before review submission.</p>
          </div>
          {editable ? (
            <Button type="button" variant="outline" onClick={() => updateCourse("lessons", [...course.lessons, createLesson()])}>
              <PlusIcon className="size-4" />
              Add lesson
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          {course.lessons.length > 0 ? (
            course.lessons.map((lesson, index) => (
              <Card key={lesson.stableId} className="rounded-lg border-dashed">
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                  <CardTitle className="text-lg">Lesson {index + 1}</CardTitle>
                  {editable ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove lesson ${index + 1}`}
                      onClick={() => updateCourse("lessons", course.lessons.filter((item) => item.stableId !== lesson.stableId))}
                    >
                      <Trash2Icon className="size-4" />
                    </Button>
                  ) : null}
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <FieldLabel label="Lesson title">
                    <input
                      value={lesson.title}
                      disabled={!editable}
                      onChange={(event) => updateLesson(lesson.stableId, { title: event.target.value })}
                      className={fieldClassName}
                    />
                  </FieldLabel>
                  <FieldLabel label="Duration">
                    <input
                      value={lesson.duration}
                      disabled={!editable}
                      onChange={(event) => updateLesson(lesson.stableId, { duration: event.target.value })}
                      className={fieldClassName}
                      placeholder="15 min"
                    />
                  </FieldLabel>
                  <div className="md:col-span-2">
                    <FieldLabel label="Summary">
                      <textarea
                        value={lesson.summary}
                        disabled={!editable}
                        onChange={(event) => updateLesson(lesson.stableId, { summary: event.target.value })}
                        className={textareaClassName}
                      />
                    </FieldLabel>
                  </div>
                  <div className="md:col-span-2">
                    <FieldLabel label="Lesson content — one block per line">
                      <textarea
                        value={lesson.content.join("\n")}
                        disabled={!editable}
                        onChange={(event) => updateLesson(lesson.stableId, { content: event.target.value.split(/\r?\n/) })}
                        className={`${textareaClassName} min-h-40`}
                      />
                    </FieldLabel>
                  </div>
                  <div className="md:col-span-2">
                    <FieldLabel label="Video URL — optional">
                      <input
                        value={lesson.videoUrl ?? ""}
                        disabled={!editable}
                        onChange={(event) => updateLesson(lesson.stableId, { videoUrl: event.target.value })}
                        className={fieldClassName}
                        placeholder="https://…"
                      />
                    </FieldLabel>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <Layers3Icon className="text-muted-foreground mx-auto size-7" />
              <p className="mt-3 font-medium">No lessons yet</p>
              <p className="text-muted-foreground mt-2 text-sm">Add a lesson to begin building course content.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className={`rounded-lg ${glassCardClassName}`}>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Quizzes</CardTitle>
            <p className="text-muted-foreground mt-2 text-sm">Quizzes are optional, but every saved quiz must be complete before review.</p>
          </div>
          {editable ? (
            <Button type="button" variant="outline" onClick={() => updateCourse("quizzes", [...course.quizzes, createQuiz()])}>
              <PlusIcon className="size-4" />
              Add quiz
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          {course.quizzes.length > 0 ? (
            course.quizzes.map((quiz, quizIndex) => (
              <Card key={quiz.stableId} className="rounded-lg border-dashed">
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                  <CardTitle className="text-lg">Quiz {quizIndex + 1}</CardTitle>
                  {editable ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove quiz ${quizIndex + 1}`}
                      onClick={() => updateCourse("quizzes", course.quizzes.filter((item) => item.stableId !== quiz.stableId))}
                    >
                      <Trash2Icon className="size-4" />
                    </Button>
                  ) : null}
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FieldLabel label="Quiz title">
                      <input
                        value={quiz.title}
                        disabled={!editable}
                        onChange={(event) => updateQuiz(quiz.stableId, { title: event.target.value })}
                        className={fieldClassName}
                      />
                    </FieldLabel>
                    <FieldLabel label="Linked lesson — optional">
                      <select
                        value={quiz.lessonStableId ?? ""}
                        disabled={!editable}
                        onChange={(event) => updateQuiz(quiz.stableId, { lessonStableId: event.target.value || undefined })}
                        className={fieldClassName}
                      >
                        <option value="">Course-level quiz</option>
                        {course.lessons.map((lesson, lessonIndex) => (
                          <option key={lesson.stableId} value={lesson.stableId}>
                            {lesson.title || `Lesson ${lessonIndex + 1}`}
                          </option>
                        ))}
                      </select>
                    </FieldLabel>
                    <FieldLabel label="Difficulty">
                      <select
                        value={quiz.difficulty}
                        disabled={!editable}
                        onChange={(event) => updateQuiz(quiz.stableId, { difficulty: event.target.value })}
                        className={fieldClassName}
                      >
                        {instructorQuizDifficulties.map((difficulty) => (
                          <option key={difficulty} value={difficulty}>
                            {difficulty}
                          </option>
                        ))}
                      </select>
                    </FieldLabel>
                    <FieldLabel label="Estimated time">
                      <input
                        value={quiz.estimatedTime}
                        disabled={!editable}
                        onChange={(event) => updateQuiz(quiz.stableId, { estimatedTime: event.target.value })}
                        className={fieldClassName}
                      />
                    </FieldLabel>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <h3 className="font-semibold">Questions</h3>
                    {editable ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuiz(quiz.stableId, { questions: [...quiz.questions, createQuestion()] })}
                      >
                        <PlusIcon className="size-4" />
                        Add question
                      </Button>
                    ) : null}
                  </div>

                  {quiz.questions.length > 0 ? (
                    <div className="space-y-4">
                      {quiz.questions.map((question, questionIndex) => (
                        <Card key={question.stableId} className="rounded-lg bg-secondary/20">
                          <CardHeader className="flex flex-row items-center justify-between gap-4">
                            <CardTitle className="text-base">Question {questionIndex + 1}</CardTitle>
                            {editable ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label={`Remove question ${questionIndex + 1}`}
                                onClick={() =>
                                  updateQuiz(quiz.stableId, {
                                    questions: quiz.questions.filter((item) => item.stableId !== question.stableId),
                                  })
                                }
                              >
                                <Trash2Icon className="size-4" />
                              </Button>
                            ) : null}
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <FieldLabel label="Prompt">
                              <textarea
                                value={question.prompt}
                                disabled={!editable}
                                onChange={(event) => updateQuestion(quiz.stableId, question.stableId, { prompt: event.target.value })}
                                className={textareaClassName}
                              />
                            </FieldLabel>

                            <div className="grid gap-3 md:grid-cols-2">
                              {question.choices.map((choice, choiceIndex) => (
                                <FieldLabel key={`${question.stableId}-${choiceIndex}`} label={`Option ${choiceIndex + 1}`}>
                                  <div className="flex gap-2">
                                    <input
                                      value={choice}
                                      disabled={!editable}
                                      onChange={(event) => {
                                        const choices = [...question.choices];
                                        choices[choiceIndex] = event.target.value;
                                        updateQuestion(quiz.stableId, question.stableId, { choices });
                                      }}
                                      className={fieldClassName}
                                    />
                                    {editable && question.choices.length > 2 ? (
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        aria-label={`Remove option ${choiceIndex + 1}`}
                                        onClick={() => {
                                          const choices = question.choices.filter((_, index) => index !== choiceIndex);
                                          const answerIndex = Math.min(question.answerIndex, choices.length - 1);
                                          updateQuestion(quiz.stableId, question.stableId, { choices, answerIndex });
                                        }}
                                      >
                                        <Trash2Icon className="size-4" />
                                      </Button>
                                    ) : null}
                                  </div>
                                </FieldLabel>
                              ))}
                            </div>

                            {editable ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  updateQuestion(quiz.stableId, question.stableId, {
                                    choices: [...question.choices, ""],
                                  })
                                }
                              >
                                <PlusIcon className="size-4" />
                                Add option
                              </Button>
                            ) : null}

                            <FieldLabel label="Correct answer">
                              <select
                                value={question.answerIndex}
                                disabled={!editable}
                                onChange={(event) =>
                                  updateQuestion(quiz.stableId, question.stableId, { answerIndex: Number(event.target.value) })
                                }
                                className={fieldClassName}
                              >
                                {question.choices.map((_, choiceIndex) => (
                                  <option key={choiceIndex} value={choiceIndex}>
                                    Option {choiceIndex + 1}
                                  </option>
                                ))}
                              </select>
                            </FieldLabel>

                            <FieldLabel label="Explanation">
                              <textarea
                                value={question.explanation}
                                disabled={!editable}
                                onChange={(event) =>
                                  updateQuestion(quiz.stableId, question.stableId, { explanation: event.target.value })
                                }
                                className={textareaClassName}
                              />
                            </FieldLabel>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed p-6 text-center">
                      <FileQuestionIcon className="text-muted-foreground mx-auto size-6" />
                      <p className="text-muted-foreground mt-2 text-sm">No questions added yet.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <FileQuestionIcon className="text-muted-foreground mx-auto size-7" />
              <p className="mt-3 font-medium">No quizzes yet</p>
              <p className="text-muted-foreground mt-2 text-sm">Quizzes are optional for a course draft.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className={`rounded-lg ${glassCardClassName}`}>
        <CardHeader>
          <CardTitle>Review readiness</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {readinessIssues.length === 0 ? (
            <div className="flex items-start gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm leading-6">
              <CheckCircle2Icon className="mt-0.5 size-5 shrink-0 text-emerald-600" />
              <p>The draft is complete enough to submit for admin review. The server will validate it again.</p>
            </div>
          ) : (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
              <p className="font-medium">Resolve these items before submission:</p>
              <ul className="text-muted-foreground mt-3 list-disc space-y-1 pl-5 text-sm leading-6">
                {readinessIssues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href="/instructor/courses">Back to courses</Link>
            </Button>
            {editable ? (
              <>
                <Button type="button" variant="outline" disabled={saving} onClick={() => void saveDraft(false)}>
                  <SaveIcon className="size-4" />
                  {saving ? "Saving…" : "Save draft"}
                </Button>
                <Button
                  type="button"
                  disabled={saving || readinessIssues.length > 0}
                  onClick={() => void saveDraft(true)}
                >
                  <SendIcon className="size-4" />
                  {saving ? "Saving…" : "Save and submit for review"}
                </Button>
              </>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
