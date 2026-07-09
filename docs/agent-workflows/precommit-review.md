# IntellectX Pre-Commit Review Workflow

Use this workflow before any commit, PR approval, or merge.

## Goal

Prove the diff is intentional, minimal, safe, validated, and consistent with IntellectX architecture.

## Review order

### 1. Repository state

Inspect:

- current branch
- changed files
- staged files
- untracked files
- diff statistics
- full diff
- whitespace and conflict markers

Preserve unrelated dirty work.

### 2. Scope control

For every changed file, answer:

- Why was this file changed?
- Is it required for the requested task?
- Was any unrelated UI, architecture, naming, formatting, or behavior changed?
- Could the same task be completed with a smaller diff?

Reject opportunistic rewrites.

### 3. Security and trust boundaries

Check for:

- hardcoded secrets or credentials
- client-trusted roles or identity
- weakened server authorization
- unsafe migration ownership
- entitlement or payment bypasses
- logging of sensitive data
- environment values accidentally committed

Payments must remain disabled unless explicitly authorized.

### 4. Auth and data correctness

When relevant, verify:

- authenticated identity comes from trusted Clerk/Convex server state
- account switching cannot leak data
- empty remote state does not revive stale cache
- logout does not erase legitimate migration data
- protected routes fail closed

Use `auth-review.md` for deeper review.

### 5. UX behavior

For user-facing actions, verify:

- successful actions provide clear feedback
- navigation goes to the next relevant page/state where appropriate
- buttons are not silent or dead-end actions
- existing UI is preserved unless the task explicitly requests visual changes

### 6. Validation

Run only checks that are relevant first, then broaden as needed:

- `npm run typecheck`
- `npm run lint`
- `npm run test:unit`
- `npm run build`
- `npm run test:e2e`
- `npm run convex:codegen` when Convex code changed

Never claim a command passed unless it actually completed successfully.

### 7. Final report

Report exactly:

- files changed
- summary of behavior changed
- validations run and results
- skipped checks and why
- known risks or uncertainty
- whether anything was committed, pushed, merged, or deployed

## Approval rule

Approve only when the diff is minimal, trust boundaries remain intact, unrelated work is preserved, and validation evidence is honest.
