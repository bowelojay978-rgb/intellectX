"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createBlankInstructorCourse,
  instructorStatusLabels,
  type InstructorCourseDraft,
  type InstructorLessonDraft,
  type InstructorQuizDraft,
  type InstructorQuizQuestionDraft,
} from "@/lib/instructor-ui-data";
import { cn } from "@/lib/utils";
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  ChevronUpIcon,
  FileQuestionIcon,
  GraduationCapIcon,
  Layers3Icon,
  PlusIcon,
  RotateCcwIcon,
  Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

type BuilderStep = "details" | "lessons" | "quizzes" | "review";

const steps: { id: BuilderStep; label: string }[] = [
  { id: "details", label: "Course details" },
  { id: "lessons", label: "Lessons" },
  { id: "quizzes", label: "Quizzes" },
  { id: "review", label: "Review" },
];

const fieldClassName =
  "border-input bg-background/80 h-11 w-full rounded-lg border px-3 text-sm outline-none transition focus:border-primary/50 focus:ring-ring/30 focus:ring-[3px]";
const textareaClassName =
  "border-input bg-background/80 min-h-28 w-full resize-y rounded-lg border px-3 py-3 text-sm leading-6 outline-none transition focus:border-primary/50 focus:ring-ring/30 focus:ring-[3px]";

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function cloneCourse(course?: InstructorCourseDraft | null) {
  return course
    ? {
        ...course,
        lessons: course.lessons.map((lesson) => ({ ...lesson })),
        quizzes: course.quizzes.map((quiz) => ({
          ...quiz,
          questions: quiz.questions.map((question) => ({ ...question, choices: [...question.choices] })),
        })),
      }
    : createBlankInstructorCourse();
}

function moveItem<T>(items: T[], index: number, direction: -1 | 1) {
  const target = index + direction;
  if (target < 0 || target >= items.length) return items;

  const next = [...items];
  const [item] = next.splice(index, 1);
  next.splice(target, 0, item);
  return next;
}

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function InstructorCourseBuilder({ initialCourse }: { initialCourse?: InstructorCourseDraft | null }) {
  const [course, setCourse] = useState<InstructorCourseDraft>(() => cloneCourse(initialCourse));
  const [step, setStep] = useState<BuilderStep>("details");
  const [error, setError] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const editing = Boolean(initialCourse);

  const currentStepIndex = steps.findIndex((item) => item.id === step);
  const detailsComplete = Boolean(
    course.title.trim() && course.subject.trim() && course.description.trim() && course.duration.trim(),
  );
  const reviewIssues = useMemo(() => {
    const issues: string[] = [];
    if (!detailsComplete) issues.push("Complete the required course details.");
    if (course.lessons.length === 0) issues.push("Add at least one lesson.");
    return issues;
  }, [course.lessons.length, detailsComplete]);

  function updateCourse<K extends keyof InstructorCourseDraft>(key: K, value: InstructorCourseDraft[K]) {
    setCourse((current) => ({ ...current, [key]: value }));
    setError(null);
  }

  function goNext() {
    setError(null);

    if (step === "details" && !detailsComplete) {
      setError("Add a title, subject, description, and duration before continuing.");
      return;
    }

    if (step === "lessons" && course.lessons.length === 0) {
      setError("Add at least one lesson before continuing.");
      return;
    }

    const next = steps[currentStepIndex + 1];
    if (next) setStep(next.id);
  }

  function goBack() {
    setError(null);
    const previous = steps[currentStepIndex - 1];
    if (previous) setStep(previous.id);
  }

  function resetBuilder() {
    setCourse(cloneCourse(initialCourse));
    setStep("details");
    setError(null);
    setFinished(false);
  }

  function addLesson() {
    const lesson: InstructorLessonDraft = {
      id: createId("lesson"),
      title: "",
      summary: "",
      duration: "",
      videoUrl: "",
      content: "",
    };

    setCourse((current) => ({ ...current, lessons: [...current.lessons, lesson] }));
    setError(null);
  }

  function updateLesson(lessonId: string, patch: Partial<InstructorLessonDraft>) {
    setCourse((current) => ({
      ...current,
      lessons: current.lessons.map((lesson) => (lesson.id === lessonId ? { ...lesson, ...patch } : lesson)),
    }));
  }

  function removeLesson(lessonId: string) {
    setCourse((current) => ({ ...current, lessons: current.lessons.filter((lesson) => lesson.id !== lessonId) }));
  }

  function moveLesson(index: number, direction: -1 | 1) {
    setCourse((current) => ({ ...current, lessons: moveItem(current.lessons, index, direction) }));
  }

  function addQuiz() {
    const quiz: InstructorQuizDraft = {
      id: createId("quiz"),
      title: "",
      difficulty: "Beginner",
      estimatedTime: "5 min",
      questions: [],
    };

    setCourse((current) => ({ ...current, quizzes: [...current.quizzes, quiz] }));
  }

  function updateQuiz(quizId: string, patch: Partial<InstructorQuizDraft>) {
    setCourse((current) => ({
      ...current,
      quizzes: current.quizzes.map((quiz) => (quiz.id === quizId ? { ...quiz, ...patch } : quiz)),
    }));
  }

  function removeQuiz(quizId: string) {
    setCourse((current) => ({ ...current, quizzes: current.quizzes.filter((quiz) => quiz.id !== quizId) }));
  }

  function moveQuiz(index: number, direction: -1 | 1) {
    setCourse((current) => ({ ...current, quizzes: moveItem(current.quizzes, index, direction) }));
  }

  function addQuestion(quizId: string) {
    const question: InstructorQuizQuestionDraft = {
      id: createId("question"),
      prompt: "",
      choices: ["", "", "", ""],
      answerIndex: 0,
      explanation: "",
    };

    setCourse((current) => ({
      ...current,
      quizzes: current.quizzes.map((quiz) =>
        quiz.id === quizId ? { ...quiz, questions: [...quiz.questions, question] } : quiz,
      ),
    }));
  }

  function updateQuestion(quizId: string, questionId: string, patch: Partial<InstructorQuizQuestionDraft>) {
    setCourse((current) => ({
      ...current,
      quizzes: current.quizzes.map((quiz) =>
        quiz.id === quizId
          ? {
              ...quiz,
              questions: quiz.questions.map((question) =>
                question.id === questionId ? { ...question, ...patch } : question,
              ),
            }
          : quiz,
      ),
    }));
  }

  function removeQuestion(quizId: string, questionId: string) {
    setCourse((current) => ({
      ...current,
      quizzes: current.quizzes.map((quiz) =>
        quiz.id === quizId
          ? { ...quiz, questions: quiz.questions.filter((question) => question.id !== questionId) }
          : quiz,
      ),
    }));
  }

  function updateChoice(quizId: string, questionId: string, choiceIndex: number, value: string) {
    const quiz = course.quizzes.find((item) => item.id === quizId);
    const question = quiz?.questions.find((item) => item.id === questionId);
    if (!question) return;

    const choices = [...question.choices];
    choices[choiceIndex] = value;
    updateQuestion(quizId, questionId, { choices });
  }

  function finishDraft() {
    if (reviewIssues.length > 0) {
      setError(reviewIssues[0]);
      return;
    }

    setFinished(true);
    setError(null);
  }

  if (finished) {
    return (
      <Card className="mx-auto max-w-3xl rounded-lg border-emerald-500/20 bg-emerald-500/5">
        <CardContent className="flex flex-col items-center gap-5 py-12 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
            <CheckCircle2Icon className="size-7" />
          </span>
          <div>
            <p className="text-muted-foreground text-sm">Frontend draft preview complete</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">{course.title}</h2>
            <p className="text-muted-foreground mx-auto mt-3 max-w-xl leading-6">
              The course passed the frontend builder flow. Nothing was written to the backend, database, or production catalog.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Button type="button" variant="outline" onClick={resetBuilder}>
              <RotateCcwIcon className="size-4" />
              Continue editing
            </Button>
            <Button asChild>
              <Link href="/instructor/courses">Return to courses</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-dashed border-primary/20 bg-primary/5 p-4 text-sm leading-6 text-muted-foreground">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p>
            {editing ? "Editing a frontend course preview." : "Creating a frontend course preview."} Changes are held in this page only and are not saved to the backend.
          </p>
          <Badge variant="secondary" className="w-fit shrink-0">Frontend only</Badge>
        </div>
      </div>

      <nav aria-label="Course builder steps" className="grid gap-2 sm:grid-cols-4">
        {steps.map((item, index) => {
          const active = item.id === step;
          const completed = index < currentStepIndex;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (index <= currentStepIndex) {
                  setStep(item.id);
                  setError(null);
                }
              }}
              className={cn(
                "flex min-h-12 items-center gap-3 rounded-lg border px-3 text-left text-sm font-medium transition",
                active && "border-primary bg-primary text-primary-foreground",
                !active && completed && "border-primary/30 bg-primary/5",
                !active && !completed && "border-border bg-background/60 text-muted-foreground",
              )}
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-full border border-current/20 text-xs">
                {completed ? <CheckCircle2Icon className="size-4" /> : index + 1}
              </span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {step === "details" ? (
        <Card className="rounded-lg">
          <CardHeader>
            <div className="flex items-start gap-3">
              <span className="bg-primary/10 text-primary grid size-11 place-items-center rounded-full">
                <GraduationCapIcon className="size-5" />
              </span>
              <div>
                <CardTitle>Course details</CardTitle>
                <p className="text-muted-foreground mt-2 text-sm">Set the core identity learners will see.</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-5 md:grid-cols-2">
            <FieldLabel label="Course title">
              <input className={fieldClassName} value={course.title} onChange={(event) => updateCourse("title", event.target.value)} placeholder="e.g. Cell Biology Foundations" />
            </FieldLabel>
            <FieldLabel label="Subject">
              <input className={fieldClassName} value={course.subject} onChange={(event) => updateCourse("subject", event.target.value)} placeholder="e.g. Biology" />
            </FieldLabel>
            <FieldLabel label="Level">
              <select className={fieldClassName} value={course.level} onChange={(event) => updateCourse("level", event.target.value as InstructorCourseDraft["level"])}>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </FieldLabel>
            <FieldLabel label="Estimated duration">
              <input className={fieldClassName} value={course.duration} onChange={(event) => updateCourse("duration", event.target.value)} placeholder="e.g. 4h 30m" />
            </FieldLabel>
            <div className="md:col-span-2">
              <FieldLabel label="Description">
                <textarea className={textareaClassName} value={course.description} onChange={(event) => updateCourse("description", event.target.value)} placeholder="Describe what learners will understand and be able to do." />
              </FieldLabel>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {step === "lessons" ? (
        <section className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Lessons</h2>
              <p className="text-muted-foreground mt-1 text-sm">Add, edit, remove, and reorder lesson content.</p>
            </div>
            <Button type="button" onClick={addLesson}>
              <PlusIcon className="size-4" />
              Add lesson
            </Button>
          </div>

          {course.lessons.length > 0 ? (
            <div className="grid gap-4">
              {course.lessons.map((lesson, index) => (
                <Card key={lesson.id} className="rounded-lg">
                  <CardHeader className="flex flex-row items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="bg-secondary grid size-9 place-items-center rounded-full text-sm font-semibold">{index + 1}</span>
                      <div>
                        <CardTitle className="text-lg">{lesson.title || `Untitled lesson ${index + 1}`}</CardTitle>
                        <p className="text-muted-foreground mt-1 text-sm">Lesson editor</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button type="button" size="icon" variant="ghost" disabled={index === 0} onClick={() => moveLesson(index, -1)} aria-label={`Move lesson ${index + 1} up`}>
                        <ChevronUpIcon className="size-4" />
                      </Button>
                      <Button type="button" size="icon" variant="ghost" disabled={index === course.lessons.length - 1} onClick={() => moveLesson(index, 1)} aria-label={`Move lesson ${index + 1} down`}>
                        <ChevronDownIcon className="size-4" />
                      </Button>
                      <Button type="button" size="icon" variant="ghost" onClick={() => removeLesson(lesson.id)} aria-label={`Delete lesson ${index + 1}`}>
                        <Trash2Icon className="size-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    <FieldLabel label="Lesson title">
                      <input className={fieldClassName} value={lesson.title} onChange={(event) => updateLesson(lesson.id, { title: event.target.value })} placeholder="Lesson title" />
                    </FieldLabel>
                    <FieldLabel label="Duration">
                      <input className={fieldClassName} value={lesson.duration} onChange={(event) => updateLesson(lesson.id, { duration: event.target.value })} placeholder="e.g. 45m" />
                    </FieldLabel>
                    <div className="md:col-span-2">
                      <FieldLabel label="Summary">
                        <textarea className={textareaClassName} value={lesson.summary} onChange={(event) => updateLesson(lesson.id, { summary: event.target.value })} placeholder="What will the learner study in this lesson?" />
                      </FieldLabel>
                    </div>
                    <div className="md:col-span-2">
                      <FieldLabel label="Video URL (optional)">
                        <input className={fieldClassName} value={lesson.videoUrl} onChange={(event) => updateLesson(lesson.id, { videoUrl: event.target.value })} placeholder="https://..." />
                      </FieldLabel>
                    </div>
                    <div className="md:col-span-2">
                      <FieldLabel label="Lesson content">
                        <textarea className={`${textareaClassName} min-h-40`} value={lesson.content} onChange={(event) => updateLesson(lesson.id, { content: event.target.value })} placeholder="Write the lesson content or teaching notes here." />
                      </FieldLabel>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="rounded-lg border-dashed">
              <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
                <Layers3Icon className="text-muted-foreground size-8" />
                <div>
                  <h3 className="font-semibold">No lessons yet</h3>
                  <p className="text-muted-foreground mt-1 text-sm">Add the first lesson to continue building this course.</p>
                </div>
                <Button type="button" onClick={addLesson}>
                  <PlusIcon className="size-4" />
                  Add first lesson
                </Button>
              </CardContent>
            </Card>
          )}
        </section>
      ) : null}

      {step === "quizzes" ? (
        <section className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Quizzes</h2>
              <p className="text-muted-foreground mt-1 text-sm">Build knowledge checks with answers and explanations.</p>
            </div>
            <Button type="button" onClick={addQuiz}>
              <PlusIcon className="size-4" />
              Add quiz
            </Button>
          </div>

          {course.quizzes.length > 0 ? (
            <div className="grid gap-5">
              {course.quizzes.map((quiz, quizIndex) => (
                <Card key={quiz.id} className="rounded-lg">
                  <CardHeader className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="bg-secondary grid size-9 place-items-center rounded-full text-sm font-semibold">{quizIndex + 1}</span>
                        <div>
                          <CardTitle className="text-lg">{quiz.title || `Untitled quiz ${quizIndex + 1}`}</CardTitle>
                          <p className="text-muted-foreground mt-1 text-sm">{quiz.questions.length} questions</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button type="button" size="icon" variant="ghost" disabled={quizIndex === 0} onClick={() => moveQuiz(quizIndex, -1)} aria-label={`Move quiz ${quizIndex + 1} up`}>
                          <ChevronUpIcon className="size-4" />
                        </Button>
                        <Button type="button" size="icon" variant="ghost" disabled={quizIndex === course.quizzes.length - 1} onClick={() => moveQuiz(quizIndex, 1)} aria-label={`Move quiz ${quizIndex + 1} down`}>
                          <ChevronDownIcon className="size-4" />
                        </Button>
                        <Button type="button" size="icon" variant="ghost" onClick={() => removeQuiz(quiz.id)} aria-label={`Delete quiz ${quizIndex + 1}`}>
                          <Trash2Icon className="size-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <FieldLabel label="Quiz title">
                        <input className={fieldClassName} value={quiz.title} onChange={(event) => updateQuiz(quiz.id, { title: event.target.value })} placeholder="Quiz title" />
                      </FieldLabel>
                      <FieldLabel label="Difficulty">
                        <select className={fieldClassName} value={quiz.difficulty} onChange={(event) => updateQuiz(quiz.id, { difficulty: event.target.value as InstructorQuizDraft["difficulty"] })}>
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                        </select>
                      </FieldLabel>
                      <FieldLabel label="Estimated time">
                        <input className={fieldClassName} value={quiz.estimatedTime} onChange={(event) => updateQuiz(quiz.id, { estimatedTime: event.target.value })} placeholder="e.g. 5 min" />
                      </FieldLabel>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {quiz.questions.map((question, questionIndex) => (
                      <div key={question.id} className="rounded-lg border bg-secondary/20 p-4">
                        <div className="mb-4 flex items-center justify-between gap-3">
                          <p className="font-medium">Question {questionIndex + 1}</p>
                          <Button type="button" size="sm" variant="ghost" onClick={() => removeQuestion(quiz.id, question.id)}>
                            <Trash2Icon className="size-4" />
                            Remove
                          </Button>
                        </div>

                        <div className="grid gap-4">
                          <FieldLabel label="Question prompt">
                            <textarea className={textareaClassName} value={question.prompt} onChange={(event) => updateQuestion(quiz.id, question.id, { prompt: event.target.value })} placeholder="Write the question." />
                          </FieldLabel>

                          <div className="grid gap-3 sm:grid-cols-2">
                            {question.choices.map((choice, choiceIndex) => (
                              <FieldLabel key={choiceIndex} label={`Choice ${choiceIndex + 1}`}>
                                <input className={fieldClassName} value={choice} onChange={(event) => updateChoice(quiz.id, question.id, choiceIndex, event.target.value)} placeholder={`Answer choice ${choiceIndex + 1}`} />
                              </FieldLabel>
                            ))}
                          </div>

                          <div className="grid gap-4 md:grid-cols-[220px_1fr]">
                            <FieldLabel label="Correct answer">
                              <select className={fieldClassName} value={question.answerIndex} onChange={(event) => updateQuestion(quiz.id, question.id, { answerIndex: Number(event.target.value) })}>
                                {question.choices.map((_, choiceIndex) => (
                                  <option key={choiceIndex} value={choiceIndex}>Choice {choiceIndex + 1}</option>
                                ))}
                              </select>
                            </FieldLabel>
                            <FieldLabel label="Explanation">
                              <textarea className={textareaClassName} value={question.explanation} onChange={(event) => updateQuestion(quiz.id, question.id, { explanation: event.target.value })} placeholder="Explain why the correct answer is correct." />
                            </FieldLabel>
                          </div>
                        </div>
                      </div>
                    ))}

                    <Button type="button" variant="outline" onClick={() => addQuestion(quiz.id)}>
                      <PlusIcon className="size-4" />
                      Add question
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="rounded-lg border-dashed">
              <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
                <FileQuestionIcon className="text-muted-foreground size-8" />
                <div>
                  <h3 className="font-semibold">No quizzes yet</h3>
                  <p className="text-muted-foreground mt-1 text-sm">Quizzes are optional in this frontend preview.</p>
                </div>
                <Button type="button" onClick={addQuiz}>
                  <PlusIcon className="size-4" />
                  Add first quiz
                </Button>
              </CardContent>
            </Card>
          )}
        </section>
      ) : null}

      {step === "review" ? (
        <section className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>Review course</CardTitle>
              <p className="text-muted-foreground text-sm">Check the complete frontend draft before finishing.</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Badge variant="secondary">{course.level}</Badge>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight">{course.title || "Untitled course"}</h2>
                <p className="text-muted-foreground mt-2 text-sm">{course.subject || "No subject"} · {course.duration || "No duration"}</p>
                <p className="text-muted-foreground mt-4 leading-6">{course.description || "No description yet."}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-secondary/40 p-4">
                  <p className="text-3xl font-semibold">{course.lessons.length}</p>
                  <p className="text-muted-foreground mt-1 text-sm">Lessons</p>
                </div>
                <div className="rounded-lg bg-secondary/40 p-4">
                  <p className="text-3xl font-semibold">{course.quizzes.length}</p>
                  <p className="text-muted-foreground mt-1 text-sm">Quizzes</p>
                </div>
              </div>

              {course.lessons.length > 0 ? (
                <div>
                  <h3 className="font-semibold">Lesson order</h3>
                  <div className="mt-3 grid gap-2">
                    {course.lessons.map((lesson, index) => (
                      <div key={lesson.id} className="flex items-center justify-between gap-3 rounded-lg bg-secondary/30 p-3 text-sm">
                        <span>{index + 1}. {lesson.title || "Untitled lesson"}</span>
                        <span className="text-muted-foreground">{lesson.duration || "No duration"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <div className="grid gap-5 content-start">
            <Card className="rounded-lg">
              <CardHeader>
                <CardTitle>Readiness</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {reviewIssues.length > 0 ? (
                  <div className="grid gap-3">
                    {reviewIssues.map((issue) => (
                      <div key={issue} className="flex items-start gap-2 rounded-lg bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200">
                        <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
                        {issue}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-start gap-2 rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-800 dark:text-emerald-200">
                    <CheckCircle2Icon className="mt-0.5 size-4 shrink-0" />
                    Ready to finish this frontend draft preview.
                  </div>
                )}
                <div className="text-muted-foreground text-sm leading-6">
                  Current status: <span className="text-foreground font-medium">{instructorStatusLabels[course.status]}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-lg border-dashed">
              <CardContent className="space-y-4 py-6">
                <p className="text-muted-foreground text-sm leading-6">
                  Finishing here only confirms the frontend flow. It does not submit, publish, save, or call a backend mutation.
                </p>
                <Button className="w-full" type="button" disabled={reviewIssues.length > 0} onClick={finishDraft}>
                  <CheckCircle2Icon className="size-4" />
                  Finish draft preview
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      ) : null}

      {error ? (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
          {error}
        </div>
      ) : null}

      <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          {currentStepIndex > 0 ? (
            <Button type="button" variant="outline" onClick={goBack}>
              <ArrowLeftIcon className="size-4" />
              Back
            </Button>
          ) : (
            <Button variant="outline" asChild>
              <Link href="/instructor/courses">Cancel</Link>
            </Button>
          )}
          <Button type="button" variant="ghost" onClick={resetBuilder}>Reset</Button>
        </div>

        {step !== "review" ? (
          <Button type="button" onClick={goNext}>
            Continue
            <ArrowRightIcon className="size-4" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
