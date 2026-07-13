import { CHANGES_REQUESTED, DRAFT, type CourseWorkflowRecord } from "./courseWorkflowMutations";

export type InstructorLessonDraftInput = {
  stableId: string;
  title: string;
  duration: string;
  summary: string;
  content: string[];
  videoUrl?: string;
  posterUrl?: string;
};

export type InstructorQuizQuestionDraftInput = {
  stableId: string;
  prompt: string;
  choices: string[];
  answerIndex: number;
  explanation: string;
};

export type InstructorQuizDraftInput = {
  stableId: string;
  lessonStableId?: string;
  title: string;
  difficulty: string;
  estimatedTime: string;
  questions: InstructorQuizQuestionDraftInput[];
};

export type InstructorCourseDraftInput = {
  stableId: string;
  slug: string;
  title: string;
  description: string;
  subject: string;
  level: string;
  duration: string;
  accent: string;
  lessons: InstructorLessonDraftInput[];
  quizzes: InstructorQuizDraftInput[];
};

export type NormalizedInstructorCourseDraft = ReturnType<typeof normalizeInstructorCourseDraftInput>;

const identifierPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const courseLevels = ["Beginner", "Intermediate", "Advanced"] as const;
const quizDifficulties = ["Foundational", "Applied", "Challenge"] as const;

function requiredText(value: string, label: string) {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(`${label} is required.`);
  }

  return normalized;
}

function optionalText(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function optionalHttpUrl(value: string | undefined, label: string) {
  const normalized = optionalText(value);
  if (!normalized) return undefined;

  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    throw new Error(`${label} must be a valid http or https URL.`);
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`${label} must be a valid http or https URL.`);
  }

  return normalized;
}

function normalizeIdentifier(value: string, label: string) {
  const normalized = requiredText(value, label).toLowerCase();

  if (!identifierPattern.test(normalized)) {
    throw new Error(`${label} must use lowercase letters, numbers, and single hyphens only.`);
  }

  return normalized;
}

function normalizeAllowedValue(value: string, label: string, allowed: readonly string[]) {
  const normalized = requiredText(value, label);

  if (!allowed.includes(normalized)) {
    throw new Error(`${label} must be one of: ${allowed.join(", ")}.`);
  }

  return normalized;
}

function assertUniqueIdentifiers(values: string[], label: string) {
  const seen = new Set<string>();

  for (const value of values) {
    if (seen.has(value)) {
      throw new Error(`Duplicate ${label}: ${value}.`);
    }

    seen.add(value);
  }
}

export function normalizeInstructorCourseDraftInput(input: InstructorCourseDraftInput) {
  const stableId = normalizeIdentifier(input.stableId, "Course stableId");
  const slug = normalizeIdentifier(input.slug, "Course slug");
  const title = requiredText(input.title, "Course title");
  const description = requiredText(input.description, "Course description");
  const subject = requiredText(input.subject, "Course subject");
  const level = normalizeAllowedValue(input.level, "Course level", courseLevels);
  const duration = requiredText(input.duration, "Course duration");
  const accent = requiredText(input.accent, "Course accent");

  const lessons = input.lessons.map((lesson, index) => ({
    stableId: normalizeIdentifier(lesson.stableId, `Lesson ${index + 1} stableId`),
    title: lesson.title.trim(),
    duration: lesson.duration.trim(),
    summary: lesson.summary.trim(),
    content: lesson.content.map((block) => block.trim()).filter(Boolean),
    videoUrl: optionalHttpUrl(lesson.videoUrl, `Lesson ${index + 1} video URL`),
    posterUrl: optionalHttpUrl(lesson.posterUrl, `Lesson ${index + 1} poster URL`),
    order: index,
  }));

  assertUniqueIdentifiers(
    lessons.map((lesson) => lesson.stableId),
    "lesson stableId",
  );

  const lessonIds = new Set(lessons.map((lesson) => lesson.stableId));

  const quizzes = input.quizzes.map((quiz, quizIndex) => {
    const quizStableId = normalizeIdentifier(quiz.stableId, `Quiz ${quizIndex + 1} stableId`);
    const lessonStableId = optionalText(quiz.lessonStableId);

    if (lessonStableId && !lessonIds.has(lessonStableId)) {
      throw new Error(`Quiz ${quizIndex + 1} references a lesson that is not part of this course.`);
    }

    const questions = quiz.questions.map((question, questionIndex) => {
      const choices = question.choices.map((choice) => choice.trim());

      if (!Number.isInteger(question.answerIndex) || question.answerIndex < 0) {
        throw new Error(`Quiz ${quizIndex + 1}, question ${questionIndex + 1} has an invalid answer index.`);
      }

      if (choices.length > 0 && question.answerIndex >= choices.length) {
        throw new Error(`Quiz ${quizIndex + 1}, question ${questionIndex + 1} answer index is out of range.`);
      }

      return {
        stableId: normalizeIdentifier(
          question.stableId,
          `Quiz ${quizIndex + 1}, question ${questionIndex + 1} stableId`,
        ),
        prompt: question.prompt.trim(),
        choices,
        answerIndex: question.answerIndex,
        explanation: question.explanation.trim(),
        order: questionIndex,
      };
    });

    assertUniqueIdentifiers(
      questions.map((question) => question.stableId),
      `question stableId in quiz ${quizStableId}`,
    );

    return {
      stableId: quizStableId,
      lessonStableId,
      title: quiz.title.trim(),
      difficulty: normalizeAllowedValue(
        quiz.difficulty.trim() || "Foundational",
        `Quiz ${quizIndex + 1} difficulty`,
        quizDifficulties,
      ),
      estimatedTime: quiz.estimatedTime.trim() || "5 min",
      order: quizIndex,
      questions,
    };
  });

  assertUniqueIdentifiers(
    quizzes.map((quiz) => quiz.stableId),
    "quiz stableId",
  );
  assertUniqueIdentifiers(
    quizzes.flatMap((quiz) => quiz.questions.map((question) => question.stableId)),
    "question stableId",
  );

  return {
    stableId,
    slug,
    title,
    description,
    subject,
    level,
    duration,
    accent,
    lessons,
    quizzes,
  };
}

export function isInstructorCourseEditable(course: CourseWorkflowRecord) {
  return course.reviewStatus === DRAFT || course.reviewStatus === CHANGES_REQUESTED;
}

export function assertInstructorCourseEditable(course: CourseWorkflowRecord) {
  if (!isInstructorCourseEditable(course)) {
    throw new Error("Course can only be edited while in draft or changes_requested state.");
  }
}

export function assertInstructorCourseVersion(
  course: { updatedAt?: number },
  expectedUpdatedAt: number | undefined,
) {
  if (course.updatedAt !== undefined && expectedUpdatedAt !== course.updatedAt) {
    throw new Error("Course draft changed since it was loaded. Reload before saving to avoid overwriting newer edits.");
  }
}

export type CourseSubmissionContent = {
  lessons: Array<{
    stableId: string;
    title: string;
    duration: string;
    summary: string;
    content: string[];
  }>;
  quizzes: Array<{
    stableId: string;
    title: string;
  }>;
  questions: Array<{
    quizStableId: string;
    prompt: string;
    choices: string[];
    answerIndex: number;
    explanation: string;
  }>;
};

export function getCourseSubmissionReadinessIssues(content: CourseSubmissionContent) {
  const issues: string[] = [];

  if (content.lessons.length === 0) {
    issues.push("Add at least one lesson before submitting for review.");
  }

  for (const lesson of content.lessons) {
    if (!lesson.title.trim() || !lesson.duration.trim() || !lesson.summary.trim() || lesson.content.every((block) => !block.trim())) {
      issues.push(`Complete the title, duration, summary, and content for lesson ${lesson.stableId}.`);
    }
  }

  for (const quiz of content.quizzes) {
    const questions = content.questions.filter((question) => question.quizStableId === quiz.stableId);

    if (!quiz.title.trim()) {
      issues.push(`Add a title to quiz ${quiz.stableId}.`);
    }

    if (questions.length === 0) {
      issues.push(`Add at least one question to quiz ${quiz.title || quiz.stableId}.`);
      continue;
    }

    for (const question of questions) {
      const choicesComplete = question.choices.length >= 2 && question.choices.every((choice) => Boolean(choice.trim()));
      const answerInRange =
        Number.isInteger(question.answerIndex) && question.answerIndex >= 0 && question.answerIndex < question.choices.length;

      if (
        !question.prompt.trim() ||
        !question.explanation.trim() ||
        !choicesComplete ||
        !answerInRange ||
        !question.choices[question.answerIndex]?.trim()
      ) {
        issues.push(`Complete every prompt, answer option, correct answer, and explanation in quiz ${quiz.title || quiz.stableId}.`);
        break;
      }
    }
  }

  return issues;
}

export function assertCourseSubmissionReady(content: CourseSubmissionContent) {
  const issues = getCourseSubmissionReadinessIssues(content);

  if (issues.length > 0) {
    throw new Error(`Course is not ready for review: ${issues[0]}`);
  }
}
