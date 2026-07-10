export type InstructorCourseStatus = "draft" | "under_review" | "published" | "archived";

export type InstructorLessonDraft = {
  id: string;
  title: string;
  summary: string;
  duration: string;
  videoUrl: string;
  content: string;
};

export type InstructorQuizQuestionDraft = {
  id: string;
  prompt: string;
  choices: string[];
  answerIndex: number;
  explanation: string;
};

export type InstructorQuizDraft = {
  id: string;
  title: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  estimatedTime: string;
  questions: InstructorQuizQuestionDraft[];
};

export type InstructorCourseDraft = {
  id: string;
  title: string;
  subject: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  description: string;
  duration: string;
  status: InstructorCourseStatus;
  updatedAt: string;
  lessons: InstructorLessonDraft[];
  quizzes: InstructorQuizDraft[];
  learnerPreviewAvailable?: boolean;
};

export const instructorStatusLabels: Record<InstructorCourseStatus, string> = {
  draft: "Draft",
  under_review: "Under review",
  published: "Published",
  archived: "Archived",
};

export const instructorWorkspaceCourses: InstructorCourseDraft[] = [
  {
    id: "ai-study-systems",
    title: "AI Study Systems",
    subject: "AI Productivity",
    level: "Beginner",
    description: "Build a reliable study workflow with AI tutors, retrieval practice, and weekly planning.",
    duration: "4h 20m",
    status: "published",
    updatedAt: "2026-07-09T14:30:00.000Z",
    learnerPreviewAvailable: true,
    lessons: [
      {
        id: "prompting-for-learning",
        title: "Prompting for learning",
        summary: "Use structured prompts to turn AI into a focused study partner.",
        duration: "45m",
        videoUrl: "",
        content: "Define the learning goal, provide context, request retrieval practice, and ask for feedback instead of direct answers.",
      },
      {
        id: "memory-systems",
        title: "Memory systems",
        summary: "Build stronger recall with spacing and retrieval practice.",
        duration: "55m",
        videoUrl: "",
        content: "Combine active recall, spaced review, and deliberate correction to strengthen long-term memory.",
      },
      {
        id: "weekly-review",
        title: "Weekly review",
        summary: "Use a weekly review to decide what to repeat, drop, or intensify.",
        duration: "40m",
        videoUrl: "",
        content: "Review learning evidence, identify weak areas, and build the next focused study plan.",
      },
    ],
    quizzes: [
      {
        id: "ai-study-systems-check",
        title: "AI Study Systems Check",
        difficulty: "Beginner",
        estimatedTime: "5 min",
        questions: [
          {
            id: "ai-q1",
            prompt: "Which approach best supports active learning with AI?",
            choices: [
              "Ask for the final answer immediately",
              "Ask for retrieval questions and feedback",
              "Copy the longest response",
              "Avoid checking mistakes",
            ],
            answerIndex: 1,
            explanation: "Retrieval questions and feedback make the learner actively reconstruct knowledge instead of passively copying answers.",
          },
        ],
      },
    ],
  },
  {
    id: "critical-thinking",
    title: "Critical Thinking Lab",
    subject: "Reasoning",
    level: "Intermediate",
    description: "Practice evidence checks, argument mapping, and bias detection with guided AI feedback.",
    duration: "5h 10m",
    status: "under_review",
    updatedAt: "2026-07-08T09:15:00.000Z",
    lessons: [
      {
        id: "argument-maps",
        title: "Argument maps",
        summary: "Break claims into reasons, evidence, assumptions, and objections.",
        duration: "50m",
        videoUrl: "",
        content: "Map a central claim, list supporting reasons, test evidence quality, and surface hidden assumptions.",
      },
      {
        id: "source-quality",
        title: "Source quality",
        summary: "Evaluate credibility, relevance, and evidence strength.",
        duration: "55m",
        videoUrl: "",
        content: "Compare source authority, methodology, recency, corroboration, and potential conflicts of interest.",
      },
    ],
    quizzes: [],
  },
  {
    id: "exam-accelerator",
    title: "Exam Accelerator",
    subject: "Exam Prep",
    level: "Advanced",
    description: "Turn course notes into adaptive revision plans, timed drills, and confidence tracking.",
    duration: "6h 45m",
    status: "published",
    updatedAt: "2026-07-06T16:45:00.000Z",
    learnerPreviewAvailable: true,
    lessons: [
      {
        id: "diagnostic-review",
        title: "Diagnostic review",
        summary: "Identify gaps before spending time on revision.",
        duration: "45m",
        videoUrl: "",
        content: "Use a short diagnostic to identify high-value gaps before building the revision plan.",
      },
    ],
    quizzes: [],
  },
  {
    id: "biology-cell-foundations",
    title: "Cell Biology Foundations",
    subject: "Biology",
    level: "Beginner",
    description: "A focused foundation in cell structure, transport, enzymes, and microscopy.",
    duration: "3h 30m",
    status: "draft",
    updatedAt: "2026-07-10T11:20:00.000Z",
    lessons: [
      {
        id: "cell-ultrastructure",
        title: "Cell ultrastructure",
        summary: "Compare organelles and connect structure to function.",
        duration: "45m",
        videoUrl: "",
        content: "Study the role of the nucleus, mitochondria, ribosomes, endoplasmic reticulum, Golgi apparatus, and membranes.",
      },
    ],
    quizzes: [],
  },
  {
    id: "chemistry-stoichiometry",
    title: "Stoichiometry Essentials",
    subject: "Chemistry",
    level: "Intermediate",
    description: "Build confidence with moles, equations, limiting reagents, and quantitative chemistry.",
    duration: "4h 05m",
    status: "archived",
    updatedAt: "2026-06-28T08:10:00.000Z",
    lessons: [],
    quizzes: [],
  },
];

export function getInstructorWorkspaceCourse(courseId: string) {
  return instructorWorkspaceCourses.find((course) => course.id === courseId) ?? null;
}

export function createBlankInstructorCourse(): InstructorCourseDraft {
  return {
    id: `course-${Date.now()}`,
    title: "",
    subject: "",
    level: "Beginner",
    description: "",
    duration: "",
    status: "draft",
    updatedAt: new Date().toISOString(),
    lessons: [],
    quizzes: [],
  };
}
