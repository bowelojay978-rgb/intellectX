"use client";

import { glassCardClassName } from "@/components/education/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  adminInstructors,
  adminInstructorStatusLabels,
  type AdminInstructor,
  type AdminInstructorStatus,
} from "@/lib/admin-ui-data";
import { cn } from "@/lib/utils";
import {
  CheckCircle2Icon,
  ChevronRightIcon,
  MailIcon,
  PauseCircleIcon,
  PlusIcon,
  SearchIcon,
  ShieldCheckIcon,
  UserCheckIcon,
  UsersIcon,
} from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";

type InstructorFilter = "all" | AdminInstructorStatus;

const statusTone: Record<AdminInstructorStatus, string> = {
  active: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  pending: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  paused: "bg-slate-500/10 text-slate-700 dark:text-slate-300",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function AdminInstructorsWorkspace() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<InstructorFilter>("all");
  const [selectedInstructorId, setSelectedInstructorId] = useState(adminInstructors[0]?.id ?? "");
  const [statusOverrides, setStatusOverrides] = useState<Record<string, AdminInstructorStatus>>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);

  const instructors = useMemo(
    () =>
      adminInstructors.map((instructor) => ({
        ...instructor,
        status: statusOverrides[instructor.id] ?? instructor.status,
      })),
    [statusOverrides],
  );

  const filteredInstructors = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return instructors.filter((instructor) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        instructor.name.toLowerCase().includes(normalizedQuery) ||
        instructor.email.toLowerCase().includes(normalizedQuery) ||
        instructor.subjects.some((subject) => subject.toLowerCase().includes(normalizedQuery));

      const matchesFilter = filter === "all" || instructor.status === filter;
      return matchesQuery && matchesFilter;
    });
  }, [filter, instructors, query]);

  const selectedInstructor =
    instructors.find((instructor) => instructor.id === selectedInstructorId) ?? filteredInstructors[0] ?? instructors[0] ?? null;

  function updateStatus(instructor: AdminInstructor, status: AdminInstructorStatus) {
    setStatusOverrides((current) => ({ ...current, [instructor.id]: status }));
    setFeedback(
      `${instructor.name} is now marked ${adminInstructorStatusLabels[status].toLowerCase()} in this frontend preview. No backend role, account, or access state changed.`,
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-muted-foreground text-sm">{instructors.length} instructors in this frontend preview.</p>
        </div>
        <Button type="button" onClick={() => setShowInvite((value) => !value)}>
          <PlusIcon className="size-4" />
          {showInvite ? "Close invite form" : "Invite instructor"}
        </Button>
      </div>

      {showInvite ? <InviteInstructorCard onClose={() => setShowInvite(false)} /> : null}

      <section className="grid gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
        <Card className={`rounded-lg ${glassCardClassName}`}>
          <CardHeader className="space-y-4">
            <div>
              <CardTitle>Instructor directory</CardTitle>
              <p className="text-muted-foreground mt-2 text-sm">Search and inspect instructor accounts.</p>
            </div>
            <label className="relative block">
              <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search name, email, or subject"
                className="border-input bg-background/80 h-10 w-full rounded-lg border pr-3 pl-10 text-sm outline-none transition focus:border-primary/50 focus:ring-3 focus:ring-ring/30"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              {([
                ["all", "All"],
                ["active", "Active"],
                ["pending", "Pending"],
                ["paused", "Paused"],
              ] as const).map(([value, label]) => (
                <Button key={value} type="button" size="sm" variant={filter === value ? "default" : "outline"} onClick={() => setFilter(value)}>
                  {label}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="grid gap-2">
            {filteredInstructors.length > 0 ? (
              filteredInstructors.map((instructor) => {
                const selected = instructor.id === selectedInstructor?.id;

                return (
                  <button
                    key={instructor.id}
                    type="button"
                    onClick={() => {
                      setSelectedInstructorId(instructor.id);
                      setFeedback(null);
                    }}
                    className={cn(
                      "flex w-full items-start justify-between gap-3 rounded-lg border p-4 text-left transition",
                      selected ? "border-primary bg-primary/5" : "border-border/70 bg-background/60 hover:bg-secondary/40",
                    )}
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="bg-primary/10 text-primary grid size-10 shrink-0 place-items-center rounded-full text-sm font-semibold">
                        {instructor.initials}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{instructor.name}</p>
                        <p className="text-muted-foreground mt-1 truncate text-sm">{instructor.email}</p>
                        <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusTone[instructor.status]}`}>
                          {adminInstructorStatusLabels[instructor.status]}
                        </span>
                      </div>
                    </div>
                    <ChevronRightIcon className="text-muted-foreground mt-1 size-4 shrink-0" />
                  </button>
                );
              })
            ) : (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                No instructors match this search and filter.
              </div>
            )}
          </CardContent>
        </Card>

        {selectedInstructor ? (
          <InstructorDetail
            instructor={selectedInstructor}
            feedback={feedback}
            onStatusChange={(status) => updateStatus(selectedInstructor, status)}
          />
        ) : (
          <Card className={`rounded-lg ${glassCardClassName}`}>
            <CardContent className="py-16 text-center text-sm text-muted-foreground">No instructor is available.</CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}

function InstructorDetail({
  instructor,
  feedback,
  onStatusChange,
}: {
  instructor: AdminInstructor;
  feedback: string | null;
  onStatusChange: (status: AdminInstructorStatus) => void;
}) {
  return (
    <div className="grid gap-5">
      <Card className={`rounded-lg ${glassCardClassName}`}>
        <CardHeader>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <span className="bg-primary text-primary-foreground grid size-14 shrink-0 place-items-center rounded-full text-lg font-semibold">
                {instructor.initials}
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-3xl tracking-tight">{instructor.name}</CardTitle>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusTone[instructor.status]}`}>
                    {adminInstructorStatusLabels[instructor.status]}
                  </span>
                </div>
                <p className="text-muted-foreground mt-2 inline-flex items-center gap-2 text-sm">
                  <MailIcon className="size-4" />
                  {instructor.email}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap gap-2">
            {instructor.subjects.map((subject) => (
              <Badge key={subject} variant="secondary">{subject}</Badge>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Published courses" value={instructor.publishedCourses.toString()} />
            <Stat label="In review" value={instructor.coursesInReview.toString()} />
            <Stat label="Learner reach" value={instructor.learnerReach.toLocaleString()} />
            <Stat label="Joined" value={formatDate(instructor.joinedAt)} />
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <Card className={`rounded-lg ${glassCardClassName}`}>
          <CardHeader>
            <CardTitle>Account activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6">
            <div className="flex items-start gap-3 rounded-lg bg-secondary/35 p-4">
              <UserCheckIcon className="mt-0.5 size-4 shrink-0" />
              <div>
                <p className="font-medium">Last active</p>
                <p className="text-muted-foreground mt-1">{formatDate(instructor.lastActiveAt)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg bg-secondary/35 p-4">
              <UsersIcon className="mt-0.5 size-4 shrink-0" />
              <div>
                <p className="font-medium">Learner reach</p>
                <p className="text-muted-foreground mt-1">{instructor.learnerReach.toLocaleString()} learners across current frontend preview data.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`rounded-lg ${glassCardClassName}`}>
          <CardHeader>
            <CardTitle>Account controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-dashed border-primary/25 bg-primary/5 p-4 text-sm leading-6 text-muted-foreground">
              Frontend-only preview: these actions do not change Clerk roles, Convex records, route access, or production permissions.
            </div>
            {feedback ? (
              <div className="rounded-lg border border-border/70 bg-secondary/35 p-4 text-sm leading-6" aria-live="polite">
                {feedback}
              </div>
            ) : null}
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {instructor.status === "pending" ? (
                <Button type="button" onClick={() => onStatusChange("active")}>
                  <CheckCircle2Icon className="size-4" />
                  Approve instructor
                </Button>
              ) : null}
              {instructor.status === "active" ? (
                <Button type="button" variant="outline" onClick={() => onStatusChange("paused")}>
                  <PauseCircleIcon className="size-4" />
                  Pause access
                </Button>
              ) : null}
              {instructor.status === "paused" ? (
                <Button type="button" onClick={() => onStatusChange("active")}>
                  <ShieldCheckIcon className="size-4" />
                  Reactivate
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/70 bg-background/60 p-4">
      <p className="text-lg font-semibold tracking-tight">{value}</p>
      <p className="text-muted-foreground mt-1 text-xs">{label}</p>
    </div>
  );
}

function InviteInstructorCard({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  function submitInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim() || !email.trim() || !subject.trim()) {
      setFeedback("Complete name, email, and subject before previewing the invitation.");
      return;
    }

    setFeedback(`Invitation prepared for ${name.trim()} in this frontend preview. No email was sent and no account was created.`);
  }

  return (
    <Card className={`rounded-lg ${glassCardClassName}`}>
      <CardHeader>
        <CardTitle>Invite instructor</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 md:grid-cols-3" onSubmit={submitInvite}>
          <label className="grid gap-2 text-sm font-medium">
            Full name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Instructor name"
              className="border-input bg-background/80 h-11 rounded-lg border px-4 text-sm outline-none transition focus:border-primary/50 focus:ring-3 focus:ring-ring/30"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              className="border-input bg-background/80 h-11 rounded-lg border px-4 text-sm outline-none transition focus:border-primary/50 focus:ring-3 focus:ring-ring/30"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Primary subject
            <input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Biology"
              className="border-input bg-background/80 h-11 rounded-lg border px-4 text-sm outline-none transition focus:border-primary/50 focus:ring-3 focus:ring-ring/30"
            />
          </label>
          <div className="md:col-span-3 rounded-lg border border-dashed border-primary/25 bg-primary/5 p-4 text-sm leading-6 text-muted-foreground">
            Frontend-only preview. Submitting this form does not send email, create a Clerk user, assign a role, or write to Convex.
          </div>
          {feedback ? (
            <div className="md:col-span-3 rounded-lg border border-border/70 bg-secondary/35 p-4 text-sm leading-6" aria-live="polite">
              {feedback}
            </div>
          ) : null}
          <div className="md:col-span-3 flex flex-col gap-3 sm:flex-row">
            <Button type="submit">
              <MailIcon className="size-4" />
              Preview invitation
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
