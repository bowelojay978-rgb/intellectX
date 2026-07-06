# Webhook Replay-Protection Design

## 1. Purpose

This document defines the design requirements for future verified billing webhooks so duplicate, stale, malformed, or replayed events cannot grant or change paid access incorrectly. It is a design guardrail, not an implementation plan for shipping webhooks.

Related references:
- [./billing-entitlement-lifecycle.md](./billing-entitlement-lifecycle.md)
- [./production-readiness-tracker.md](./production-readiness-tracker.md)
- [./production-smoke-test-checklist.md](./production-smoke-test-checklist.md)
- [./security-env-audit.md](./security-env-audit.md)

## 2. Threats this protects against

- Duplicate webhook deliveries that re-apply the same entitlement change.
- Replayed events from an earlier delivery window that should not be accepted again.
- Malformed payloads that could cause unsafe entitlement writes.
- Stale lifecycle events that overwrite newer entitlement state.
- Client-side redirects or checkout success flows being mistaken for verified provider events.

## 3. Required trusted inputs

Only the following inputs are considered trusted after the provider request is verified:

- Provider event ID
- Provider event timestamp or occurrence time
- Provider subscription or customer identifiers
- Provider event type
- Trusted account identity from server-side provider metadata
- Server-side verification result, including signature validity

Signature verification must happen before any replay checks are applied. A request that fails signature verification must be rejected before any event identity or replay state is considered.

## 4. Event identity strategy

Each provider event must be represented by a stable event identity that is derived from provider metadata and persisted server-side.

Required rules:

- The provider event ID must be stored and checked for every accepted event.
- Unknown or missing event IDs must fail closed unless the provider has a documented alternative that is explicitly approved for this integration.
- Event identity must be tied to the provider, the relevant subscription or customer identifier, and the event type.
- The event identity must be used to prevent duplicate processing across retries and replayed deliveries.

## 5. Replay detection rules

Replay detection must happen after signature verification and before any entitlement mutation is applied.

Required rules:

- A previously seen provider event ID must be treated as a duplicate and must not re-apply entitlement changes.
- Duplicate events must not double-grant access.
- Replay detection must be persistent and server-side so retries and duplicate deliveries cannot bypass it.
- Unknown, malformed, or absent event IDs must not be accepted as safe replay inputs.

## 6. Stale event handling

Older lifecycle events must not overwrite newer entitlement state.

Required rules:

- A newer provider event must take precedence over an older event for the same subscription or entitlement scope.
- If an incoming event is older than the latest persisted state for the same subscription, it must be rejected or ignored as stale.
- Stale events must not downgrade a valid active entitlement to a blocked state unless the provider event is explicitly confirmed as the latest authoritative state.
- Checkout success redirects are not webhook proof and must never be treated as a substitute for verified webhook processing.

## 7. Idempotency rules

The entitlement write path must be idempotent so repeated deliveries do not cause inconsistent state.

Required rules:

- Reprocessing the same verified event must not create duplicate entitlement records or duplicate side effects.
- Repeated delivery of the same event after a successful write must be treated as a no-op.
- The write path must be safe for retries after transient server failures, provided the event identity is already known and the event is still valid.

## 8. Fail-closed cases

The system must fail closed whenever trust cannot be established.

Required rules:

- Unknown or malformed events must fail closed.
- Missing provider event IDs must fail closed unless the provider has a documented approved alternative.
- Signature failures must fail closed.
- Events that cannot be matched to trusted account metadata must fail closed.
- Only verified server-side provider events may write entitlement status.

## 9. Future implementation checklist

- [ ] Define the provider webhook secret and signature verification path.
- [ ] Persist provider event IDs and replay state server-side.
- [ ] Reject duplicate, malformed, and missing-event-ID payloads before any entitlement write.
- [ ] Compare incoming events against the latest persisted entitlement state to prevent stale overwrites.
- [ ] Ensure the entitlement mutation is idempotent and safe for retries.
- [ ] Keep checkout success redirects separate from webhook-based entitlement writes.
- [ ] Validate the full flow in the production deployment smoke checklist before enabling any paid access.
