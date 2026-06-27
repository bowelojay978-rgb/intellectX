import { PageShell } from "@/components/education/page-shell";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function LessonNotFound() {
  return (
    <PageShell>
      <section className="mx-auto flex max-w-xl flex-col items-center gap-5 text-center">
        <p className="text-muted-foreground text-sm font-medium uppercase tracking-normal">Lesson</p>
        <h1 className="text-4xl leading-[1.1] font-medium tracking-tight md:text-6xl">Lesson not found</h1>
        <p className="text-muted-foreground leading-6">
          This lesson is not available in the current mock curriculum.
        </p>
        <Button asChild>
          <Link href="/courses">Browse courses</Link>
        </Button>
      </section>
    </PageShell>
  );
}
