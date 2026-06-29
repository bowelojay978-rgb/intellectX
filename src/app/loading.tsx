import { AppLoadingSpinner } from "@/components/ui/app-loading-spinner";

export default function Loading() {
  return (
    <main className="grid min-h-dvh place-items-center bg-background px-6">
      <AppLoadingSpinner showLabel />
    </main>
  );
}
