import { QuizPageContent } from "@/components/education/quiz-page-content";
import { getQuiz, quizzes } from "@/data/quizzes";
import { getLearnerQuizDetail } from "@/lib/learner-catalog";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type QuizPageProps = {
  params: Promise<{ quizId: string }>;
  searchParams: Promise<{ from?: string }>;
};

export function generateStaticParams() {
  return quizzes.map((quiz) => ({ quizId: quiz.id }));
}

export async function generateMetadata({ params }: QuizPageProps): Promise<Metadata> {
  const { quizId } = await params;
  const detail = await getLearnerQuizDetail(quizId);
  const quiz = detail?.quiz ?? getQuiz(quizId);

  return {
    title: quiz ? `${quiz.title} - IntellectX` : "Quiz - IntellectX",
    description: "Practice with an IntellectX multiple-choice quiz.",
  };
}

export default async function QuizPage({ params, searchParams }: QuizPageProps) {
  const { quizId } = await params;
  const { from } = await searchParams;
  const detail = await getLearnerQuizDetail(quizId);
  const quiz = detail?.quiz;
  const course = detail?.course;

  if (!quiz || !course) {
    notFound();
  }

  return <QuizPageContent quiz={quiz} courseId={course.id} mobileRequested={from === "mobile"} />;
}
