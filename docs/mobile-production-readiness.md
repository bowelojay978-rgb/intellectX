# Mobile Production Readiness

Status date: 2026-07-13

Development branch: `fix/mobile-production-readiness`

## Product contract

The dedicated IntellectX native mobile study surface is intentionally limited to:

1. Quizzes
2. Flashcards

Notes, courses, dashboard, progress, profile, search, pricing, checkout, instructor, and admin surfaces are not part of the native free-study experience. Authentication continuation, mandatory learner onboarding, quiz detail routes, and legal routes remain allowed because they are required to support the mobile flow.

## Hardened in this work

- Enforces the native route boundary globally and redirects web-only native navigation back to `/mobile-quizzes`.
- Starts the Capacitor wrapper at `/mobile-quizzes`.
- Keeps Quizzes first and Flashcards second across entry cards and bottom navigation.
- Keeps mobile quiz detail inside the mobile shell, including direct native `/quiz/...` deep links.
- Preserves the existing learner auth guard, migration bridge, and learner-data sync components for mobile quiz detail.
- Preserves mandatory Study Profile onboarding for native Clerk signup.
- Routes local fallback login/signup and onboarding to the correct runtime destination instead of detouring through web-only `/courses`.
- Uses the shared learner catalog for mobile quizzes and flashcards while preserving the static fallback when Convex is not configured.
- Adds explicit loading and empty states.
- Adds `viewport-fit=cover`, safe-area-aware navigation/header spacing, larger touch targets, and mobile overflow hardening.
- Excludes legacy `/mobile-notes` from native scope while preserving its informational web compatibility route.
- Adds a packaged `public/mobile-error.html` retry screen that returns to the configured mobile start route after connectivity recovers.
- Adds unit and Playwright regression coverage for feature scope, ordering, native redirects, mobile quiz-shell continuity, native quiz deep links, and runtime-aware onboarding behavior.

## Validation state

The mobile branch was rebuilt on the latest authoritative `main` baseline before merge review so newer auth, search, lesson-progress, quiz-history, and study-stats integrity work remained preserved.

Confirmed on the rebased branch:

- GitHub reports the pull request as mergeable.
- The complete rebased mobile branch receives a successful Vercel deployment after restoring the no-Convex static catalog path.
- All Codex P2 findings identified during review were fixed or shown to be stale against current `main`, and their review threads were resolved.
- A documentation-only control deployment and the mobile runtime/shell layer also deployed successfully during fault isolation.
- GitHub Actions still fails before executing any job steps or exposing job logs, so that runner result is non-actionable and does not provide code-level validation evidence.

A successful merge does not by itself make the native app store-release-ready. Final native release validation still requires:

- `npm ci`
- `npm run typecheck`
- `npm run lint`
- `npm run test:unit`
- `npm run build`
- focused mobile Playwright tests
- full E2E suite
- Android `npx cap sync android`
- Android debug/release build validation
- real-device checks for safe areas, keyboard behavior, back navigation, authentication, onboarding, quizzes, flashcards, offline/error behavior, and app resume

## Remaining release risk

### Remote WebView production architecture

`capacitor.config.ts` still sets `server.url` to the deployed Vercel web app. Capacitor documents `server.url` as a live-reload/development option and explicitly states it is not intended for production. A production native release should move to bundled web assets or another explicitly approved native hosting architecture before store release.

The local `errorPath` improves failure behavior but does not remove that architectural dependency.

## Merge policy

Merge only after explicit approval, latest-main alignment, successful preview validation, and no known unresolved branch-introduced blocking defect. Native store-release approval remains a separate gate.
