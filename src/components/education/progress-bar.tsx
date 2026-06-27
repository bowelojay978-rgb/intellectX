import { cn } from "@/lib/utils";

type ProgressBarProps = {
  value: number;
  className?: string;
};

export function ProgressBar({ value, className }: ProgressBarProps) {
  const progress = Math.min(Math.max(value, 0), 100);

  return (
    <div className={cn("bg-secondary h-2 w-full overflow-hidden rounded-full", className)}>
      <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${progress}%` }} />
    </div>
  );
}
