import { PageShell } from "@/components/education/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getStaffPlaceholderMetadata } from "@/lib/staff-route-placeholder";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Instructor - IntellectX",
  description: "Placeholder instructor workspace for future production course workflow controls.",
};

export default function InstructorPage() {
  const metadata = getStaffPlaceholderMetadata("instructor");

  return (
    <PageShell>
      <section className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
        <Badge variant="secondary" className="uppercase">
          {metadata.roleLabel}
        </Badge>
        <h1 className="text-4xl leading-[1.1] font-medium tracking-tight md:text-6xl">{metadata.heading}</h1>
        <p className="text-muted-foreground max-w-2xl leading-6 md:text-lg">{metadata.summary}</p>
        <p className="text-muted-foreground max-w-2xl leading-6">{metadata.detail}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/">Return home</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/courses">Browse learner courses</Link>
          </Button>
        </div>
      </section>
    </PageShell>
  );
}
