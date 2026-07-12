# Auth UI Regression Fix Notes

## Scope

This fix addresses two connected user-facing regressions:

1. Login and Signup could disappear from the navigation while Clerk authentication was still loading.
2. Authenticated application routes such as `/courses` could render an empty main area while authentication or account preparation was unresolved.

## What was wrong

### Missing Login and Signup

`ClerkLearnerSessionStatus` returned `null` whenever Clerk reported `isLoaded === false`. That removed the entire right-side auth action area from the navigation. If Clerk took longer than expected to resolve, users saw no Login or Signup actions at all.

### Blank Courses and other guarded pages

`ClerkPageShell` correctly refused to expose authenticated learner content until the session was loaded, signed in, had a user ID, and the account-isolation preparation step matched the active Clerk user. However, when those conditions were not yet satisfied, `PageShellFrame` rendered `null` in the main content area.

The access control was correct, but the UI failure mode was not: a secure pending state appeared to the user as a broken blank page.

## What was fixed

### Navigation auth actions now remain visible

While Clerk is unresolved, the navigation now keeps the existing Login and Signup links visible instead of returning `null`. These links do not grant access and do not weaken route guards.

### Guarded pages now show explicit auth states

Authenticated routes now resolve to one of four explicit UI states:

- `ready`
- `loading-auth`
- `redirecting-login`
- `preparing-account`

When the page is not ready, IntellectX shows a clear loading or redirect message instead of an empty screen. The unresolved-auth state also provides direct recovery actions to return home or go to login.

### Account isolation remains intact

This fix does not bypass authentication, invent learner IDs, enable local-user fallbacks, or expose guarded course content before the authenticated Clerk user has completed the existing account-preparation step.

## Prevention

A dedicated auth UI state resolver and unit tests now cover:

- unresolved Clerk state
- signed-out app access
- authenticated account preparation
- ready authenticated access
- public routes remaining visible while Clerk loads

This makes the blank-state behavior explicit and regression-testable instead of relying on scattered boolean conditions.
