# IntellectX Bundled Mobile Client

This directory contains the dedicated bundled native-mobile target for IntellectX.

## Product scope

The native app remains intentionally limited to:

1. Quizzes
2. Flashcards

Notes, courses, dashboard, progress, profile, search, pricing, checkout, instructor, and admin surfaces are not part of the native mobile product.

## Architecture

- The full Next.js web app remains independent and is not converted to a whole-app static export.
- This target uses `output: "export"` and produces local assets in `mobile-client/out`.
- Shared lesson, quiz metadata, and flashcard derivation logic are reused from the root application.
- The bundled quiz foundation exports metadata only. Answer keys and scoring remain owned by the shared/backend assessment contract.
- The Capacitor production config has not been switched to this bundle yet. Cutover remains blocked until authentication, mandatory onboarding, live Convex data, quiz execution, Android builds, and real-device validation pass.

## Commands

```bash
npm run dev:mobile
npm run build:mobile
npm run test:unit
npm run check:mobile-release
```

`npm run check:mobile-release:strict` is intentionally expected to remain blocked while the production Capacitor config still contains a remote `server.url` and before bundled assets become the validated release target.

## Current readiness

Implemented in this foundation:

- static-exported dedicated mobile target;
- safe-area-aware mobile shell;
- Quizzes + Flashcards-only navigation;
- offline status and foreground-resume connectivity refresh;
- shared quiz metadata consumption without bundled answer keys;
- interactive flashcard review derived from shared lesson blocks;
- source-level regression checks for architecture and product-scope boundaries.

Still required before production cutover:

- configured-environment `npm run build:mobile` proof;
- bundled Clerk login/signup;
- mandatory Study Profile onboarding;
- live Convex-backed learner catalog;
- backend-authoritative quiz execution contract;
- Capacitor `webDir` cutover and production `server.url` removal;
- Android `cap sync`, debug build, release build, signing, and physical-device QA.
