# Mobile Native Delivery Architecture Decision

Status: Accepted target architecture; implementation pending

Date: 2026-07-13

Owner: Bowelo Deep Engineering

## Decision

The production native IntellectX app will not ship permanently by loading the public Vercel web deployment through Capacitor `server.url`.

The target production architecture is a **bundled mobile client** dedicated to the approved native scope:

1. Quizzes
2. Flashcards

The mobile client will be packaged with the native application and will reuse shared IntellectX domain logic, types, learner-catalog rules, auth contracts, and design primitives where practical. Clerk and Convex communication must happen through supported client-side flows for the bundled mobile runtime. The full Next.js web application remains a separate web deployment.

Release builds must ultimately omit production `server.url`. A remote development URL may only be supplied through an explicit development-only configuration path.

## Why this decision is necessary

The current Capacitor configuration loads `https://intellect-x-coral.vercel.app` through `server.url`. Capacitor documents this option as intended for live-reload servers and not for production.

A direct switch from the current Next.js application to `output: "export"` is not a safe drop-in replacement. The current application uses Next.js server-dependent behavior, including response headers configured in `next.config.ts`, and learner routes that can resolve live Convex-backed content during server rendering. Next.js static export does not support server headers and other request/server-dependent features.

Therefore, simply deleting `server.url`, pointing `webDir` at an `out` folder, or enabling a whole-application static export would risk breaking web security headers, dynamic learner data, authentication behavior, and non-mobile routes.

## Architectural constraints

- Native product scope remains Quizzes + Flashcards only.
- Mandatory Study Profile onboarding remains required.
- The web application remains production-grade and must not be weakened to satisfy native packaging.
- Shared learner visibility, entitlement, quiz, flashcard, and identity rules must not fork into conflicting mobile-specific copies.
- Native release builds must work from bundled assets without depending on the Vercel page host for initial application boot.
- Network connectivity is still required for live Clerk/Convex-backed functionality unless and until an explicit offline data model is implemented.

## Implementation direction

Create a dedicated bundled mobile application target inside the repository rather than converting the complete Next.js web application into a static export.

The implementation should:

1. Package local mobile web assets with Capacitor.
2. Keep the native route surface limited to quizzes, flashcards, authentication continuation, onboarding, quiz detail, and required legal screens.
3. Reuse shared domain modules instead of cloning quiz, catalog, entitlement, or learner-profile rules.
4. Use client-side Clerk and Convex integrations that are valid inside the packaged runtime.
5. Preserve the existing full Next.js web deployment independently.
6. Make development remote-host loading explicit and environment-specific instead of hardcoded into the production Capacitor config.
7. Add automated release checks that fail when a production native build still contains a remote `server.url`.

## Rejected options

### Keep the current production `server.url`

Rejected as the permanent store-release architecture because the native binary would remain a remote WebView wrapper around the Vercel deployment and Capacitor explicitly documents `server.url` as not intended for production.

### Convert the entire Next.js application to static export

Rejected as a direct migration path because the current application contains server-dependent behavior that is incompatible with a whole-app static export without broader architectural changes.

### Duplicate the mobile product as an unrelated second codebase

Rejected because it would create competing sources of truth for learner visibility, quizzes, flashcards, onboarding, and authorization rules.

## Release gates

The production-native delivery blocker is not closed until all of the following are true:

- [ ] Dedicated bundled mobile target exists.
- [ ] Production Capacitor config contains no remote `server.url`.
- [ ] Development-only remote loading is isolated from release configuration.
- [ ] Quizzes work from the bundled mobile runtime.
- [ ] Flashcards work from the bundled mobile runtime.
- [ ] Clerk login/signup and mandatory onboarding work from the bundled mobile runtime.
- [ ] Convex-backed learner data works from the bundled mobile runtime.
- [ ] Direct quiz navigation works after cold start and app resume.
- [ ] Android debug build passes.
- [ ] Android release build passes.
- [ ] Physical-device validation passes.
- [ ] CI rejects accidental reintroduction of production `server.url`.

## Current audit findings that remain separate blockers

- Android release minification is currently disabled.
- Android application backup is currently enabled.
- CI previously omitted the existing unit test suite; the audit branch adds it to the validation workflow.
- iOS release readiness has not yet been established.

These findings require separate validation and should not be hidden by the native delivery architecture work.
