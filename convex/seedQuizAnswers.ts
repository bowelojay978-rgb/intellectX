export type SeedQuizAnswer = {
  quizId: string;
  questionId: string;
  answerIndex: number;
  explanation: string;
};

export const seedQuizAnswers: SeedQuizAnswer[] = [
  {
    quizId: "ai-study-systems-check",
    questionId: "q1",
    answerIndex: 1,
    explanation: "A learning loop creates feedback and retrieval practice instead of passive answer consumption.",
  },
  {
    quizId: "ai-study-systems-check",
    questionId: "q2",
    answerIndex: 0,
    explanation: "AI can generate practice, but source-grounded correction keeps learning accurate.",
  },
  {
    quizId: "ai-study-systems-check",
    questionId: "q3",
    answerIndex: 1,
    explanation: "Weekly reviews become useful when they produce a specific next study decision.",
  },
  {
    quizId: "critical-thinking-check",
    questionId: "q1",
    answerIndex: 1,
    explanation: "Argument maps clarify how a conclusion is supported and where it may be weak.",
  },
  {
    quizId: "critical-thinking-check",
    questionId: "q2",
    answerIndex: 1,
    explanation: "Primary sources and recency reduce the risk of relying on stale or distorted claims.",
  },
  {
    quizId: "critical-thinking-check",
    questionId: "q3",
    answerIndex: 0,
    explanation: "Counterexamples stress-test the scope of an idea and improve precision.",
  },
  {
    quizId: "exam-accelerator-check",
    questionId: "q1",
    answerIndex: 0,
    explanation: "A diagnostic shows which gaps matter most so study time can be targeted.",
  },
  {
    quizId: "exam-accelerator-check",
    questionId: "q2",
    answerIndex: 1,
    explanation: "Producing an answer exposes what memory can actually retrieve.",
  },
  {
    quizId: "exam-accelerator-check",
    questionId: "q3",
    answerIndex: 1,
    explanation: "Timed practice improves when you inspect both the answer and the decision process.",
  },
];

export function getSeedQuizAnswer(quizId: string, questionId: string) {
  const answer = seedQuizAnswers.find((item) => item.quizId === quizId && item.questionId === questionId);

  if (!answer) {
    throw new Error(`Missing seed answer authority for quiz ${quizId}, question ${questionId}.`);
  }

  return answer;
}
