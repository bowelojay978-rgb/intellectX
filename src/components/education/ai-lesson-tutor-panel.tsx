"use client";

import { elevatedGlassCardClassName } from "@/components/education/glass-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Lesson } from "@/data/lessons";
import type { LessonTutorResponse } from "@/lib/ai-lesson-tutor-schema";
import { convexApi } from "@/lib/convex-api";
import { convexEnv } from "@/lib/education-data";
import { useAction } from "convex/react";
import { SparklesIcon } from "lucide-react";
import { useState } from "react";

type AiLessonTutorPanelProps = {
  lesson: Lesson;
};

function getLocalUnavailableResponse(lesson: Lesson): LessonTutorResponse {
  return {
    status: "unavailable",
    lessonId: lesson.id,
    summary: `Lesson tutor support for ${lesson.title} is not configured yet.`,
    keyIdeas: [lesson.summary, lesson.content[0] ?? lesson.summary],
    checkForUnderstanding: [
      {
        question: `What is the main idea of ${lesson.title}?`,
        expectedAnswer: lesson.summary,
      },
    ],
    commonMisconceptions: ["AI-generated tutoring is not enabled yet, so this panel only uses the lesson content."],
    nextStudyStep: "Review the lesson, try the inline checkpoint, then open the related quiz when you are ready.",
    groundedInLesson: true,
  };
}

function isTutorCheck(value: unknown): value is LessonTutorResponse["checkForUnderstanding"][number] {
  if (!value || typeof value !== "object") return false;

  const check = value as Partial<LessonTutorResponse["checkForUnderstanding"][number]>;
  return typeof check.question === "string" && typeof check.expectedAnswer === "string";
}

function isLessonTutorResponse(value: unknown): value is LessonTutorResponse {
  if (!value || typeof value !== "object") return false;

  const response = value as Partial<LessonTutorResponse>;

  return (
    (response.status === "ready" || response.status === "unavailable" || response.status === "error") &&
    typeof response.lessonId === "string" &&
    typeof response.summary === "string" &&
    Array.isArray(response.keyIdeas) &&
    response.keyIdeas.every((idea) => typeof idea === "string") &&
    Array.isArray(response.checkForUnderstanding) &&
    response.checkForUnderstanding.every(isTutorCheck) &&
    Array.isArray(response.commonMisconceptions) &&
    response.commonMisconceptions.every((item) => typeof item === "string") &&
    typeof response.nextStudyStep === "string" &&
    response.groundedInLesson === true
  );
}

function LessonTutorResult({ result }: { result: LessonTutorResponse }) {
  return (
    <div className="space-y-5 text-sm leading-6">
      <p className="text-muted-foreground">{result.summary}</p>

      <div>
        <p className="font-semibold">Key ideas</p>
        <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-5">
          {result.keyIdeas.map((idea) => (
            <li key={idea}>{idea}</li>
          ))}
        </ul>
      </div>

      <div>
        <p className="font-semibold">Check your understanding</p>
        {result.checkForUnderstanding.map((check) => (
          <div key={check.question} className="mt-2 rounded-lg bg-secondary/50 p-4">
            <p>{check.question}</p>
            <p className="text-muted-foreground mt-2">{check.expectedAnswer}</p>
          </div>
        ))}
      </div>

      <div>
        <p className="font-semibold">Next study step</p>
        <p className="text-muted-foreground mt-2">{result.nextStudyStep}</p>
      </div>

      {result.commonMisconceptions.length > 0 && (
        <div>
          <p className="font-semibold">Keep in mind</p>
          <p className="text-muted-foreground mt-2">{result.commonMisconceptions[0]}</p>
        </div>
      )}
    </div>
  );
}

export function AiLessonTutorPanel({ lesson }: AiLessonTutorPanelProps) {
  if (!convexEnv.isConfigured) {
    return <LocalAiLessonTutorPanel lesson={lesson} />;
  }

  return <ConvexAiLessonTutorPanel lesson={lesson} />;
}

function LocalAiLessonTutorPanel({ lesson }: AiLessonTutorPanelProps) {
  const [result, setResult] = useState<LessonTutorResponse | null>(null);

  return (
    <LessonTutorShell
      loading={false}
      result={result}
      onRequestHelp={() => setResult(getLocalUnavailableResponse(lesson))}
    />
  );
}

function ConvexAiLessonTutorPanel({ lesson }: AiLessonTutorPanelProps) {
  const getLessonTutor = useAction(convexApi.aiTutor.getLessonTutor);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LessonTutorResponse | null>(null);

  async function requestHelp() {
    setLoading(true);

    try {
      const response = await getLessonTutor({
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        lessonSummary: lesson.summary,
        lessonContent: lesson.content,
      });
      setResult(isLessonTutorResponse(response) ? response : getLocalUnavailableResponse(lesson));
    } catch {
      setResult(getLocalUnavailableResponse(lesson));
    } finally {
      setLoading(false);
    }
  }

  return <LessonTutorShell loading={loading} result={result} onRequestHelp={requestHelp} />;
}

function LessonTutorShell({
  loading,
  result,
  onRequestHelp,
}: {
  loading: boolean;
  result: LessonTutorResponse | null;
  onRequestHelp: () => void;
}) {
  return (
    <Card role="region" aria-label="AI lesson tutor" className={`rounded-lg ${elevatedGlassCardClassName}`}>
      <CardHeader>
        <p className="text-muted-foreground flex items-center gap-2 text-sm">
          <SparklesIcon className="size-4" />
          Lesson-scoped support
        </p>
        <CardTitle className="text-2xl tracking-tight">AI lesson tutor</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-muted-foreground text-sm leading-6">
          Get help grounded in this lesson only. Provider-backed tutoring is not enabled yet.
        </p>
        <Button onClick={onRequestHelp} disabled={loading}>
          <SparklesIcon />
          {loading ? "Preparing help" : "Get lesson help"}
        </Button>
        {result && <LessonTutorResult result={result} />}
      </CardContent>
    </Card>
  );
}
