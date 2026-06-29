import type { FeatureVisualType } from "@/components/features/features";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2Icon, FileTextIcon, PlayCircleIcon, Rows3Icon } from "lucide-react";
import type React from "react";

type FeatureVisualProps = {
  type: FeatureVisualType;
};

export function FeatureVisual({ type }: FeatureVisualProps) {
  if (type === "notes") {
    return (
      <VisualFrame>
        <div className="grid h-full gap-4 md:grid-cols-[0.75fr_1.25fr]">
          <aside className="rounded-lg border bg-background/80 p-4">
            <Badge variant="secondary">Instructor notes</Badge>
            <div className="mt-5 grid gap-3">
              {["Definitions", "Worked example", "Common mistake"].map((item) => (
                <div key={item} className="rounded-lg bg-secondary/45 p-3 text-sm font-medium">
                  {item}
                </div>
              ))}
            </div>
          </aside>
          <article className="rounded-lg border bg-background/80 p-5">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-full bg-primary text-primary-foreground">
                <FileTextIcon className="size-5" />
              </span>
              <div>
                <p className="font-semibold">Structured explanation</p>
                <p className="text-muted-foreground text-sm">Curated below every lesson video</p>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              <div className="h-3 w-5/6 rounded-full bg-foreground/20" />
              <div className="h-3 w-full rounded-full bg-foreground/10" />
              <div className="h-3 w-3/4 rounded-full bg-foreground/10" />
            </div>
            <div className="mt-6 rounded-lg border-l-4 border-foreground bg-secondary/45 p-4 text-sm">
              Key idea: connect the rule to one worked example before practicing.
            </div>
          </article>
        </div>
      </VisualFrame>
    );
  }

  if (type === "quizzes") {
    return (
      <VisualFrame>
        <div className="mx-auto max-w-2xl rounded-lg border bg-background/80 p-5">
          <div className="mb-5 flex items-center justify-between gap-4">
            <Badge variant="secondary">Question 4 of 8</Badge>
            <span className="text-muted-foreground text-sm">6 min practice</span>
          </div>
          <p className="text-xl font-semibold tracking-tight">Which step best tests your understanding?</p>
          <div className="mt-5 grid gap-3">
            {["Reread the summary", "Answer from memory first", "Skip to the next lesson"].map((choice, index) => (
              <div
                key={choice}
                className={`flex items-center gap-3 rounded-lg border p-4 text-sm ${
                  index === 1 ? "border-success bg-success/10" : "bg-secondary/35"
                }`}
              >
                {index === 1 ? <CheckCircle2Icon className="text-success size-5" /> : <span className="size-5 rounded-full border" />}
                {choice}
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-lg bg-secondary/55 p-4 text-sm leading-6 text-muted-foreground">
            Feedback appears immediately so learners can correct the misconception before moving on.
          </div>
        </div>
      </VisualFrame>
    );
  }

  return (
    <VisualFrame>
      <div className="grid h-full gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="overflow-hidden rounded-lg border bg-black text-white">
          <div className="aspect-video bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.28),_transparent_32%),linear-gradient(135deg,_#050505,_#1f2937)] p-5">
            <div className="flex h-full flex-col justify-between">
              <div className="flex items-center gap-2 text-sm text-white/70">
                <PlayCircleIcon className="size-5" />
                Video lesson
              </div>
              <p className="max-w-md text-2xl font-semibold tracking-tight">Watch the concept, then apply it</p>
            </div>
          </div>
          <div className="space-y-3 p-4">
            <div className="h-1.5 rounded-full bg-white/15">
              <div className="h-full w-3/5 rounded-full bg-white" />
            </div>
            <div className="flex items-center justify-between text-xs text-white/60">
              <span>12:42</span>
              <span>21:00</span>
            </div>
          </div>
        </div>
        <aside className="grid gap-3">
          {["Logic basics", "Worked proof", "Practice recap"].map((item, index) => (
            <div key={item} className="rounded-lg border bg-background/80 p-3">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-full bg-secondary">
                  <Rows3Icon className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-medium">{item}</p>
                  <p className="text-muted-foreground text-xs">{index + 1} of 3</p>
                </div>
              </div>
            </div>
          ))}
        </aside>
      </div>
    </VisualFrame>
  );
}

function VisualFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-card flex min-h-[360px] w-full items-center justify-center rounded-lg border p-5 shadow-sm md:p-8">
      <div className="w-full max-w-4xl">{children}</div>
    </div>
  );
}
