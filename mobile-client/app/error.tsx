"use client";

import { MobileShell } from "@mobile/components/mobile-shell";
import Link from "next/link";
import { useEffect } from "react";

export default function MobileError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Bundled mobile route error", error);
  }, [error]);

  return (
    <MobileShell>
      <section className="mobile-card mobile-empty" role="alert">
        <span className="mobile-eyebrow">Something went wrong</span>
        <h1 className="mobile-title">We couldn&apos;t open this screen.</h1>
        <p className="mobile-description">
          Try again. If the problem continues, return to quizzes and restart from a supported mobile route.
        </p>
        <div className="mobile-grid">
          <button type="button" className="mobile-button" onClick={reset}>
            Try again
          </button>
          <Link className="mobile-button mobile-button-secondary" href="/mobile-quizzes/">
            Back to quizzes
          </Link>
        </div>
      </section>
    </MobileShell>
  );
}
