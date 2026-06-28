import { Skeleton } from "@/components/ui/skeleton";

export default function LegalLoading() {
  return (
    <main className="relative mx-auto w-full max-w-3xl px-2 py-12">
      <section className="mb-10 text-center">
        <Skeleton className="mx-auto mb-4 h-6 w-32 rounded-full" />
        <Skeleton className="mx-auto h-12 w-full max-w-md" />
      </section>
      <section className="space-y-4 rounded-lg border border-white/70 bg-white/75 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-card/75">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-4/5" />
      </section>
    </main>
  );
}
