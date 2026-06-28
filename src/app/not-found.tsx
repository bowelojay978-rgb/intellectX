import { PageShell } from "@/components/education/page-shell";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NotFound() {
  return (
    <PageShell>
      <section className="mx-auto flex max-w-xl flex-col items-center gap-5 text-center">
        <p className="text-muted-foreground text-sm font-medium uppercase tracking-normal">404</p>
        <h1 className="text-4xl leading-[1.1] font-medium tracking-tight md:text-6xl">Page not found</h1>
        <p className="text-muted-foreground leading-6">
          The page you are looking for is not available. Return home or continue with the course catalog.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild>
            <Link href="/">Home</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/courses">Courses</Link>
          </Button>
        </div>
      </section>
    </PageShell>
  );
}
