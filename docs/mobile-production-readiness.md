# Mobile Production Readiness

Status date: 2026-07-13

Branch: `fix/mobile-production-readiness`

## Product contract

The dedicated IntellectX native mobile study surface is intentionally limited to:

1. Quizzes
2. Flashcards

Notes, courses, dashboard, progress, profile, search, pricing, checkout, instructor, and admin surfaces are not part of the native free-study experience. Authentication continuation, mandatory learner onboarding, quiz detail routes, and legal routes remain allowed because they are required to support the mobile flow.

## Hardened in this branch

- Enforces the native route boundary globally and redirects web-only native navigation back to `/mobile-quizzes`.
- Starts the Capacitor wrapper at `/mobile-quizzes`.
- Keeps Quizzes first and Flashcards second across entry cards and bottom navigation.
- Keeps mobile quiz detail inside the mobile shell, including direct native `/quiz/...` deep links.
- Preserves the existing learner auth guard, migration bridge, and learner-data sync components for mobile quiz detail.
- Preserves mandatory Study Profile onboarding for native Clerk signup.
- Routes local fallback login/signup and onboarding to the correct runtime destination instead of detouring through web-only `/courses`.
- Uses the shared learner catalog for mobile quizzes and flashcards so mobile does not maintain a separate catalog truth.
- Adds explicit loading and empty states.
- Adds `viewport-fit=cover`, safe-area-aware navigation/header spacing, larger touch targets, and mobile overflow hardening.
- Excludes legacy `/mobile-notes` from native scope while preserving its informational web compatibility route.
- Adds a packaged `public/mobile-error.html` retry screen for WebView load errors.
- Adds unit and Playwright regression coverage for feature scope, ordering, native redirects, mobile quiz-shell continuity, and native quiz deep links.

## Remaining release risks

### 1. Remote WebView production architecture

`capacitor.config.ts` still sets `server.url` to the deployed Vercel web app. Capacitor documents `server.url` as a live-reload/development option and explicitly states it is not intended for production. A production native release should move to bundled web assets or another explicitly approved native hosting architecture before store release.

The local `errorPath` added in this branch improves failure behavior but does not remove that architectural dependency.

### 2. Preview validation is unresolved

The PR preview currently reports a Vercel deployment failure. The failure appeared immediately after a successful deployment during a rapid sequence of branch commits, and GitHub Actions jobs are also failing before exposing runnable steps or logs. This is not sufficient evidence to declare the code broken or healthy.

Do not merge or release based only on static review. Final release validation requires:

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

## Merge policy

This work must remain on `fix/mobile-production-readiness` until explicitly approved. Do not auto-merge to `main`.
