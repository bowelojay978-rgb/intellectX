type VisualMemoryCardProps = {
  title: string;
  cue: string;
  detail: string;
};

export function VisualMemoryCard({ title, cue, detail }: VisualMemoryCardProps) {
  return (
    <div className="animate-widget rounded-lg border border-white/70 bg-white/60 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-card/60">
      <p className="text-muted-foreground text-xs font-medium uppercase tracking-normal">Visual memory card</p>
      <h3 className="mt-2 text-xl font-semibold tracking-tight">{title}</h3>
      <div className="my-4 rounded-lg bg-secondary/60 p-4 text-center font-medium">{cue}</div>
      <p className="text-muted-foreground text-sm leading-6">{detail}</p>
    </div>
  );
}
