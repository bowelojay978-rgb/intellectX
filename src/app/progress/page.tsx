import { DataSourceBadge } from "@/components/education/data-source-badge";
import { LocalProgressContent } from "@/components/education/local-progress-content";
import { PageShell } from "@/components/education/page-shell";
import { Badge } from "@/components/ui/badge";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Progress - IntellectX",
  description: "Track IntellectX learning progress, streaks, quizzes, and next focus areas.",
};

export default function ProgressPage() {
  return (
    <PageShell>
      <section className="mb-8 flex flex-col gap-4">
        <Badge variant="secondary" className="w-fit uppercase">
          Progress
        </Badge>
        <DataSourceBadge />
        <h1 className="text-4xl leading-[1.1] font-medium tracking-tight md:text-6xl">Your learning momentum</h1>
        <p className="text-muted-foreground max-w-2xl leading-6">
          See selected courses and learning activity hydrated from your account when available. Missing data is shown as
          an empty state instead of estimated progress.
        </p>
      </section>
      <LocalProgressContent />
    </PageShell>
  );
}


