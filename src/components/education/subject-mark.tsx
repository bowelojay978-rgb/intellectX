import { cn } from "@/lib/utils";

type SubjectMarkProps = {
  subject: string;
  className?: string;
};

export function getSubjectMark(subject: string) {
  const normalizedSubject = subject.toLowerCase();

  if (normalizedSubject.includes("ai")) return "\u2726";
  if (normalizedSubject.includes("reason")) return "\u25c8";
  if (normalizedSubject.includes("exam")) return "\u25c9";
  if (normalizedSubject.includes("biology")) return "\u25ce";
  if (normalizedSubject.includes("math")) return "\u223f";
  if (normalizedSubject.includes("finance")) return "\u25cd";

  return "\u2727";
}

export function SubjectMark({ subject, className }: SubjectMarkProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "border-foreground/10 bg-secondary/45 text-foreground/70 inline-grid size-6 shrink-0 place-items-center rounded-full border text-xs font-medium grayscale",
        className,
      )}
    >
      {getSubjectMark(subject)}
    </span>
  );
}
