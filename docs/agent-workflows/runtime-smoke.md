# IntellectX Runtime Smoke Workflow

Use this workflow for user-facing auth, onboarding, course, lesson, quiz, progress, profile, migration, logout, and account-switch changes.

## Goal

Validate the real browser lifecycle, not just isolated functions.

## Core lifecycle

Run the relevant subset of this sequence:

1. fresh browser state
2. open public homepage
3. sign up or sign in
4. complete required onboarding/course selection when applicable
5. save academic profile
6. open dashboard
7. open course and lesson
8. create lesson progress
9. complete quiz attempt
10. verify final quiz results appear only after completion
11. refresh the page
12. navigate away and back
13. sign out
14. sign in again as the same account
15. verify remote state restores
16. sign out and sign in as a second account
17. verify no data leaks across accounts
18. switch back where supported and verify authoritative state restores

## Required evidence

Capture where tooling supports it:

- screenshots at important checkpoints
- Playwright trace on failure
- video on failure for difficult flows
- browser console errors
- failed network requests
- current URL
- localStorage snapshot before and after critical lifecycle actions
- auth identity metadata that is safe to expose
- exact failed assertion and reproduction steps

Do not capture or publish secrets, raw session tokens, credentials, or private keys.

## Auth-specific assertions

- signed-out pages do not expose authenticated learner data
- account B never displays account A data
- logout does not erase legitimate anonymous data intended for migration
- empty remote state does not revive stale local cache from another user
- direct account switching retriggers identity-dependent hydration
- protected routes fail closed while auth state is unresolved or invalid

## UX assertions

- successful actions provide visible feedback
- navigation proceeds to the next relevant state where appropriate
- no silent button presses
- loading states do not flash stale data from another account
- refresh does not regress to fake/mock data

## Failure report

For every failure, include:

- lifecycle step
- expected result
- actual result
- screenshot/trace location when available
- console/network evidence
- likely ownership layer: UI, auth, cache, Convex, data model, migration, or test
- whether the failure is deterministic or intermittent

## Completion rule

Do not claim a lifecycle flow passed unless the actual browser flow was executed successfully end to end.
