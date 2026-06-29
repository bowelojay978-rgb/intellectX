import { cn } from "@/lib/utils";

type AppLoadingSpinnerProps = {
  className?: string;
  label?: string;
  size?: "sm" | "md";
  showLabel?: boolean;
};

const segmentCount = 12;
const sizeClassName = {
  sm: "size-8",
  md: "size-12",
};
const segmentClassName = {
  sm: "h-1.5 w-0.5",
  md: "h-2 w-1",
};
const segmentOffset = {
  sm: "0.875rem",
  md: "1.25rem",
};

export function AppLoadingSpinner({ className, label = "Loading", size = "sm", showLabel = false }: AppLoadingSpinnerProps) {
  return (
    <div
      role="status"
      aria-label={label}
      data-testid="app-loading-spinner"
      className={cn("inline-flex flex-col items-center gap-3", className)}
    >
      <div className={cn("relative animate-spin", sizeClassName[size])}>
        {Array.from({ length: segmentCount }).map((_, index) => (
          <span
            key={index}
            className={cn("absolute top-1/2 left-1/2 block rounded-full bg-foreground", segmentClassName[size])}
            style={{
              opacity: 0.22 + (index / segmentCount) * 0.72,
              transform: `translate(-50%, -50%) rotate(${index * (360 / segmentCount)}deg) translateY(-${segmentOffset[size]})`,
              transformOrigin: "center",
            }}
          />
        ))}
      </div>
      {showLabel && <span className="text-muted-foreground text-xs font-medium">{label}</span>}
    </div>
  );
}
