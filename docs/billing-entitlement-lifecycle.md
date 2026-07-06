# Billing Entitlement Lifecycle

Payments and checkout remain disabled. This document defines the production entitlement lifecycle foundation that future verified webhook handling must use before any paid content is exposed.

## Event Contract

Only server/provider-verified billing events may write entitlement records. Frontend state, checkout query params, localStorage, pricing cards, and checkout success redirects are not entitlement proof.

Supported lifecycle events:

| Event | Entitlement outcome | Access effect |
| --- | --- | --- |
| `checkout_completed` | `active` | Allows paid access only after server write succeeds. |
| `subscription_created` | `active` | Allows paid access. |
| `subscription_renewed` | `active` | Keeps or restores paid access. |
| `subscription_cancelled` | `cancelled` | Blocks paid access. |
| `subscription_expired` | `expired` | Blocks paid access. |
| `payment_failed` | `payment_failed` | Blocks paid access. |
| `payment_refunded` | `refunded` | Blocks paid access. |

Unknown or missing billing event types fail closed and must not update entitlements.

## Convex Write Path

The Convex entitlement write foundation is `entitlements.applyVerifiedBillingEntitlementEvent`. It is an internal mutation, not a public client mutation.

The mutation requires:

- `verified: true`
- `billingEventType`
- `userKey`
- `productKey`
- `provider`
- `providerCustomerId`
- `providerSubscriptionId`
- optional `providerEventId`
- optional `currentPeriodEndsAt`
- optional `occurredAt`

The mutation upserts by user, product, provider, and subscription id so repeated lifecycle updates for the same subscription do not create confusing duplicate entitlements. It stores provider/customer/subscription/event metadata for audit.

## Webhook Policy

No public webhook route has been added yet. The future webhook endpoint must:

- require a server-side webhook secret;
- verify the provider signature before calling Convex;
- reject unsigned, unconfigured, malformed, replayed, or unknown events;
- map provider-specific events into the lifecycle events above;
- derive the destination `userKey` from trusted account metadata;
- call only the internal Convex entitlement mutation after verification.

Checkout success redirects must never call entitlement writes directly and must never be treated as paid access proof.

## Remaining Blockers

- Real Clerk + Convex auth configuration.
- Verified provider webhook endpoint.
- Replay protection and webhook event audit strategy.
- Subscription lifecycle QA across renewal, cancellation, expiry, refund, and payment failure.
- Checkout enablement only after auth, entitlements, and webhook verification are production-ready.
