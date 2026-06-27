"use client";

import { Button } from "@/components/ui/button";
import { BackgroundBlur } from "@/components/ui/background-blur";
import { SparklesIcon } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="relative isolate grid min-h-screen place-items-center overflow-hidden px-6 py-16">
      <BackgroundBlur className="-top-40 md:-top-0" />
      <section className="mx-auto max-w-xl text-center">
        <span className="bg-primary text-primary-foreground mx-auto mb-6 grid size-12 place-items-center rounded-full">
          <SparklesIcon className="size-5" />
        </span>
        <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-[0.18em] uppercase">
          IntellectX
        </p>
        <h1 className="text-4xl leading-tight font-medium tracking-tight md:text-5xl">Something needs a quick reset.</h1>
        <p className="text-muted-foreground mt-4 leading-7">
          The prototype hit an unexpected client error. You can retry the current view or return home.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button type="button" onClick={reset}>
            Try again
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Back home</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
