export type QuizQuestion = {
  id: string;
  prompt: string;
  choices: string[];
  answerIndex: number;
  explanation: string;
};

export type Quiz = {
  id: string;
  courseId: string;
  lessonId?: string;
  title: string;
  difficulty: "Foundational" | "Applied" | "Challenge";
  estimatedTime: string;
  questions: QuizQuestion[];
};

export const quizzes: Quiz[] = [
  {
    id: "ai-study-systems-check",
    courseId: "ai-study-systems",
    lessonId: "prompting-for-learning",
    title: "AI Study Systems Check",
    difficulty: "Foundational",
    estimatedTime: "6 min",
    questions: [
      {
        id: "q1",
        prompt: "Which prompt pattern best supports learning?",
        choices: [
          "Give me the final answer only.",
          "Explain, question me, diagnose gaps, then suggest one next step.",
          "Rewrite my notes in a longer format.",
          "Summarize every topic with no follow-up.",
        ],
        answerIndex: 1,
        explanation: "A learning loop creates feedback and retrieval practice instead of passive answer consumption.",
      },
      {
        id: "q2",
        prompt: "What should stay central when using AI-generated practice questions?",
        choices: [
          "The original source material and your own retrieval attempt.",
          "The longest possible AI response.",
          "Avoiding correction until the end of the term.",
          "Using only summaries instead of questions.",
        ],
        answerIndex: 0,
        explanation: "AI can generate practice, but source-grounded correction keeps learning accurate.",
      },
      {
        id: "q3",
        prompt: "What is the best output of a weekly review?",
        choices: [
          "A vague promise to study more.",
          "A small plan with priority topics, practice format, and protected time.",
          "A full rewrite of every note.",
          "Skipping topics that felt difficult.",
        ],
        answerIndex: 1,
        explanation: "Weekly reviews become useful when they produce a specific next study decision.",
      },
    ],
  },
  {
    id: "critical-thinking-check",
    courseId: "critical-thinking",
    lessonId: "argument-maps",
    title: "Critical Thinking Check",
    difficulty: "Applied",
    estimatedTime: "7 min",
    questions: [
      {
        id: "q1",
        prompt: "What is the main purpose of an argument map?",
        choices: [
          "To make an argument look more complex.",
          "To separate claims, evidence, assumptions, and objections.",
          "To remove uncertainty from a topic.",
          "To replace source checking.",
        ],
        answerIndex: 1,
        explanation: "Argument maps clarify how a conclusion is supported and where it may be weak.",
      },
      {
        id: "q2",
        prompt: "Which source-checking habit matters most for high-stakes claims?",
        choices: [
          "Trust whichever summary is shortest.",
          "Check primary sources and dates.",
          "Ignore incentives if the writing sounds polished.",
          "Use only social proof.",
        ],
        answerIndex: 1,
        explanation: "Primary sources and recency reduce the risk of relying on stale or distorted claims.",
      },
      {
        id: "q3",
        prompt: "Why are counterexamples useful?",
        choices: [
          "They reveal where a claim needs boundaries or revision.",
          "They prove every claim is false.",
          "They replace evidence.",
          "They make arguments less precise.",
        ],
        answerIndex: 0,
        explanation: "Counterexamples stress-test the scope of an idea and improve precision.",
      },
    ],
  },
  {
    id: "exam-accelerator-check",
    courseId: "exam-accelerator",
    lessonId: "diagnostic-review",
    title: "Exam Accelerator Check",
    difficulty: "Challenge",
    estimatedTime: "8 min",
    questions: [
      {
        id: "q1",
        prompt: "Why start with a diagnostic before building an exam plan?",
        choices: [
          "It finds the highest-value gaps under realistic conditions.",
          "It removes the need for revision.",
          "It guarantees a perfect score.",
          "It makes spaced repetition unnecessary.",
        ],
        answerIndex: 0,
        explanation: "A diagnostic shows which gaps matter most so study time can be targeted.",
      },
      {
        id: "q2",
        prompt: "What does active recall force you to do?",
        choices: [
          "Recognize familiar wording.",
          "Produce an answer before reviewing the explanation.",
          "Avoid mistakes entirely.",
          "Study only when confidence is high.",
        ],
        answerIndex: 1,
        explanation: "Producing an answer exposes what memory can actually retrieve.",
      },
      {
        id: "q3",
        prompt: "What should you review after a timed practice set?",
        choices: [
          "Only the final score.",
          "Decisions, pacing, accuracy, and alternate paths.",
          "Nothing until exam day.",
          "Only questions you answered correctly.",
        ],
        answerIndex: 1,
        explanation: "Timed practice improves when you inspect both the answer and the decision process.",
      },
    ],
  },
];

export function getQuiz(id: string) {
  return quizzes.find((quiz) => quiz.id === id);
}

export function getQuizzesByCourse(courseId: string) {
  return quizzes.filter((quiz) => quiz.courseId === courseId);
}
