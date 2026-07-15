# IntellectX Auth Review Workflow

Use this workflow for any change touching Clerk, Convex auth, learner identity, staff roles, account switching, migration, protected routes, or authenticated data sync.

## Goal

Prove that protected behavior uses trusted server identity, fails closed, keeps accounts isolated, and does not erase or leak legitimate learner data.

## Review scope

Inspect the complete path:

`route -> component -> hook -> helper -> Convex query/mutation -> database table/index -> authorization decision`

Do not review only the edited file.

## Required checks

### Clerk and provider boundaries

- Verify Clerk hooks only render beneath a valid `ClerkProvider`.
- Verify Convex-only or local fallback modes do not crash because of direct Clerk hook usage.
- Distinguish auth loaded, signed in, signed out, and unresolved states explicitly.
- Do not use browser cache markers as proof of authentication.

### Trusted identity

- Protected Convex functions must use `ctx.auth.getUserIdentity()` or another trusted server-side identity source.
- Never authorize from client-provided `userId`, email, role, ownership, entitlement, or migration source alone.
- Staff routes and staff mutations must fail closed when trusted claims are absent or invalid.
- Instructor ownership checks must be enforced server-side.

### Account isolation

Test or reason through:

1. anonymous/local learner state
2. sign in as account A
3. save data
4. refresh
5. sign out
6. sign in as account B
7. verify account A data is not visible
8. switch directly A -> B where supported
9. switch B -> A and verify authoritative remote state restores correctly

Effects and hydration logic that depend on authenticated identity must react to the actual user identity, not only boolean auth state.

### Local and remote authority

- Define which source is authoritative for each authenticated state.
- An empty remote account must not accidentally display stale local cache from another user.
- Avoid silent stale-cache resurrection after logout, refresh, or account switch.
- Clear only the state that is safe to clear.
- Signed-out route visits must not erase legitimate pre-login data intended for migration.

### Migration

- Prove ownership of any source data being migrated.
- A guessable client-supplied source key is not sufficient ownership proof.
- Migration must be idempotent or safely duplicate-resistant.
- Clear old local source data only after confirmed successful migration.
- Never let account B claim account A or another guessed source key.

### Storage

Inventory all touched browser keys and classify each as:

- anonymous/local-only
- authenticated cache
- migration source
- UI preference
- security-sensitive or prohibited

Never store trusted roles, authorization state, secrets, or entitlement authority in localStorage.

## Required evidence

Report:

- exact files inspected
- exact trust boundaries found
- client-controlled inputs reaching protected code
- account-switch behavior
- empty-remote behavior
- migration ownership behavior
- browser storage touched
- tests run and results
- untested paths and remaining uncertainty

## Stop conditions

Do not approve or merge if any of these remain unresolved:

- protected action trusts client role or identity
- account A can expose data to account B
- logout or signed-out route access can erase legitimate migration data
- empty remote state can reveal stale local data from another account
- migration source ownership is guessable or unverified
- Clerk hooks can execute outside the required provider tree
- validation failures are hidden or dismissed
