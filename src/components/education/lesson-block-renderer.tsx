import { TapReveal } from "@/components/education/tap-reveal";
import { VisualMemoryCard } from "@/components/education/visual-memory-card";
import type { LessonBlock } from "@/data/lessons";
import { CheckCircle2Icon, GitBranchIcon, SparklesIcon } from "lucide-react";

type LessonBlockRendererProps = {
  blocks: LessonBlock[];
};

export function LessonBlockRenderer({ blocks }: LessonBlockRendererProps) {
  return (
    <div className="space-y-5">
      {blocks.map((block, index) => {
        if (block.type === "text") {
          return (
            <p key={index} className="animate-widget text-base leading-8 md:text-lg">
              {block.body}
            </p>
          );
        }

        if (block.type === "keyTerm") {
          return (
            <div key={index} className="animate-widget rounded-lg border-l-4 border-foreground bg-secondary/40 p-5">
              <p className="flex items-center gap-2 font-semibold">
                <SparklesIcon className="size-4" />
                {block.term}
              </p>
              <p className="text-muted-foreground mt-2 text-sm leading-6">{block.definition}</p>
            </div>
          );
        }

        if (block.type === "visualMemoryCard") {
          return <VisualMemoryCard key={index} title={block.title} cue={block.cue} detail={block.detail} />;
        }

        if (block.type === "tapReveal") {
          return <TapReveal key={index} prompt={block.prompt} explanation={block.explanation} />;
        }

        if (block.type === "checkpoint") {
          return (
            <div key={index} className="animate-widget rounded-lg bg-secondary/40 p-5">
              <p className="flex items-center gap-2 font-semibold">
                <CheckCircle2Icon className="size-4" />
                Inline checkpoint
              </p>
              <p className="mt-3">{block.prompt}</p>
              <p className="text-muted-foreground mt-3 text-sm leading-6">{block.answer}</p>
            </div>
          );
        }

        return (
          <div key={index} className="animate-widget rounded-lg border border-dashed p-5">
            <p className="flex items-center gap-2 font-semibold">
              <GitBranchIcon className="size-4" />
              {block.title}
            </p>
            <div className="my-4 grid h-28 place-items-center rounded-lg bg-secondary/40 text-sm text-muted-foreground">
              Subtle diagram placeholder
            </div>
            <p className="text-muted-foreground text-sm leading-6">{block.description}</p>
          </div>
        );
      })}
    </div>
  );
}
