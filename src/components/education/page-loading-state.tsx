import { PageShell } from "@/components/education/page-shell";
import { glassCardClassName } from "@/components/education/glass-card";
import { AppLoadingSpinner } from "@/components/ui/app-loading-spinner";
import { Skeleton } from "@/components/ui/skeleton";

type PageLoadingStateProps = {
  cards?: number;
};

export function PageLoadingState({ cards = 3 }: PageLoadingStateProps) {
  return (
    <PageShell>
      <section className="mb-10 flex flex-col items-center gap-5 text-center">
        <AppLoadingSpinner />
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-12 w-full max-w-2xl md:h-16" />
        <Skeleton className="h-5 w-full max-w-xl" />
      </section>
      <section className="grid gap-5 md:grid-cols-3">
        {Array.from({ length: cards }).map((_, index) => (
          <div key={index} className={`rounded-lg border p-6 ${glassCardClassName}`}>
            <Skeleton className="mb-5 h-6 w-28 rounded-full" />
            <Skeleton className="mb-4 h-7 w-3/4" />
            <Skeleton className="mb-3 h-4 w-full" />
            <Skeleton className="mb-6 h-4 w-5/6" />
            <Skeleton className="h-10 w-full rounded-full" />
          </div>
        ))}
      </section>
    </PageShell>
  );
}
