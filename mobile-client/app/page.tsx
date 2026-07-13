import { MobileShell } from "@mobile/components/mobile-shell";
import Link from "next/link";

export default function MobileHomePage() {
  return (
    <MobileShell>
      <section className="mobile-hero">
        <span className="mobile-eyebrow">Focused mobile study</span>
        <h1 className="mobile-title">Quizzes and flashcards. Nothing extra.</h1>
        <p className="mobile-description">
          The bundled IntellectX mobile experience stays intentionally focused on retrieval practice and rapid review.
        </p>
      </section>

      <section className="mobile-grid" aria-label="Mobile study features">
        <article className="mobile-card">
          <span className="mobile-eyebrow">01</span>
          <h2>Quizzes</h2>
          <p>Practice focused knowledge checks from the shared learner catalog.</p>
          <Link className="mobile-button" href="/mobile-quizzes/">
            Open quizzes
          </Link>
        </article>

        <article className="mobile-card">
          <span className="mobile-eyebrow">02</span>
          <h2>Flashcards</h2>
          <p>Review shared lesson memory cards without expanding the native product scope.</p>
          <Link className="mobile-button" href="/mobile-flashcards/">
            Open flashcards
          </Link>
        </article>
      </section>
    </MobileShell>
  );
}
