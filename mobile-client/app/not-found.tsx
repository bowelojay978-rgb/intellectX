import { MobileShell } from "@mobile/components/mobile-shell";
import Link from "next/link";

export default function NotFound() {
  return (
    <MobileShell>
      <section className="mobile-card mobile-empty">
        <span className="mobile-eyebrow">Page not found</span>
        <h1 className="mobile-title">This mobile screen is not available.</h1>
        <p className="mobile-description">
          Return to quizzes or flashcards and continue studying from the supported mobile experience.
        </p>
        <Link className="mobile-button" href="/mobile-quizzes/">
          Back to quizzes
        </Link>
      </section>
    </MobileShell>
  );
}
