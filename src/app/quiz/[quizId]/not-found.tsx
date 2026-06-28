import { PageShell } from "@/components/education/page-shell";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function QuizNotFound() {
  return (
    <PageShell>
      <section className="mx-auto flex max-w-xl flex-col items-center gap-5 text-center">
        <p className="text-muted-foreground text-sm font-medium uppercase tracking-normal">Quiz</p>
        <h1 className="text-4xl leading-[1.1] font-medium tracking-tight md:text-6xl">Quiz not found</h1>
        <p className="text-muted-foreground leading-6">
          This knowledge check is not available in the current IntellectX catalog.
        </p>
        <Button asChild>
          <Link href="/dashboard">Go to dashboard</Link>
        </Button>
      </section>
    </PageShell>
  );
}

