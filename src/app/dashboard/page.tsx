import { LearnerSessionName } from "@/components/auth/learner-session-name";
import { DataSourceBadge } from "@/components/education/data-source-badge";
import { LocalDashboardContent } from "@/components/education/local-dashboard-content";
import { PageShell } from "@/components/education/page-shell";
import { Badge } from "@/components/ui/badge";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard - IntellectX",
  description: "View IntellectX courses, recent lessons, quiz progress, and study focus.",
};

export default function DashboardPage() {
  return (
    <PageShell>
      <section className="mb-8 flex flex-col gap-4">
        <Badge variant="secondary" className="w-fit uppercase">
          Dashboard
        </Badge>
        <DataSourceBadge />
        <h1 className="text-4xl leading-[1.1] font-medium tracking-tight md:text-6xl">
          Welcome back, <LearnerSessionName firstNameOnly />
        </h1>
        <p className="text-muted-foreground max-w-2xl leading-6">
          Your learning cockpit for selected courses and activity loaded from your account when available.
        </p>
      </section>
      <LocalDashboardContent />
    </PageShell>
  );
}






