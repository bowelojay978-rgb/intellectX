import { lessons } from "@/data/lessons";
import { quizzes } from "@/data/quizzes";
import { buildFlashcardReviewCards } from "@/lib/flashcard-review";

export type BundledMobileQuizSummary = {
  id: string;
  courseId: string;
  title: string;
  difficulty: string;
  estimatedTime: string;
  questionCount: number;
};

// The bundled foundation intentionally exports quiz metadata only. Answer keys
// and scoring semantics remain owned by the shared/backend assessment contract.
export const bundledMobileQuizSummaries: BundledMobileQuizSummary[] = quizzes.map((quiz) => ({
  id: quiz.id,
  courseId: quiz.courseId,
  title: quiz.title,
  difficulty: quiz.difficulty,
  estimatedTime: quiz.estimatedTime,
  questionCount: quiz.questions.length,
}));

export const bundledMobileFlashcards = buildFlashcardReviewCards(lessons);
