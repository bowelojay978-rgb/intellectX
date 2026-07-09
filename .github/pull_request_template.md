## Summary

Describe exactly what changed and why.

## Scope

- [ ] Change is narrowly scoped.
- [ ] No unrelated files were modified.
- [ ] Existing UI was preserved unless the task explicitly required visual changes.

## Security and trust boundaries

- [ ] No secrets, API keys, tokens, or credentials were committed.
- [ ] Client-provided identity, role, ownership, entitlement, or migration claims are not trusted for protected actions.
- [ ] Payments remain disabled unless explicitly authorized.

## Validation

Check every command that actually ran successfully:

- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm run test:unit`
- [ ] `npm run build`
- [ ] `npm run test:e2e`
- [ ] `npm run convex:codegen` when Convex code changed

## Evidence

Include relevant screenshots, traces, failing/passing CI links, or reproduction steps where appropriate.

## Risk and rollback

Describe remaining risk, skipped validation, assumptions, and the simplest rollback path.
