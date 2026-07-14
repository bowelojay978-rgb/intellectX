import { MobileShell } from "@mobile/components/mobile-shell";
import { bundledMobileQuizSummaries } from "@mobile/lib/mobile-catalog";

export default function MobileQuizzesPage() {
  return (
    <MobileShell>
      <section className="mobile-hero">
        <span className="mobile-eyebrow">Mobile quizzes</span>
        <h1 className="mobile-title">Practice with focused quizzes</h1>
        <p className="mobile-description">
          Choose a knowledge check, answer at your pace, and review explanations when quiz execution is available.
        </p>
      </section>

      {bundledMobileQuizSummaries.length === 0 ? (
        <section className="mobile-card mobile-empty">
          <h2>No quizzes available yet</h2>
          <p>New knowledge checks will appear here when they are ready for learners.</p>
        </section>
      ) : (
        <section className="mobile-grid" aria-label="Available quizzes">
          {bundledMobileQuizSummaries.map((quiz) => (
            <article className="mobile-card" key={quiz.id}>
              <div className="mobile-meta">
                <span className="mobile-chip">{quiz.difficulty}</span>
                <span className="mobile-chip">{quiz.estimatedTime}</span>
                <span className="mobile-chip">
                  {quiz.questionCount} {quiz.questionCount === 1 ? "question" : "questions"}
                </span>
              </div>
              <h2>{quiz.title}</h2>
            </article>
          ))}
        </section>
      )}
    </MobileShell>
  );
}
