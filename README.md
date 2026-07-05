# IntellectX

IntellectX is a polished free-MVP education web app built with Next.js, React, Tailwind CSS, and optional Convex persistence.

The current app includes a learner-facing frontend for courses, lessons, quizzes, progress, dashboard, profile, lesson-attached instructional notes, video placeholders, and study streaks. Learner sessions are local browser sessions in this MVP. Convex can be connected for persistence, while the app keeps a safe local catalog fallback when Convex is not configured.

Paid checkout is disabled by default. Paddle-related checkout code is preserved for future payment/access work, but paid production remains blocked until real auth, entitlements, webhook verification, and server-side authorization exist.

## Tech Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Convex, optional
- Paddle checkout code preserved for future paid-access work

## Development

Install dependencies with npm:

```bash
npm install
```

Run the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Free MVP Mode

IntellectX runs as a free MVP unless payments are explicitly enabled.

- `NEXT_PUBLIC_PAYMENTS_ENABLED=false` keeps `/checkout` on the "Premium checkout is not live yet" safety page.
- Learner signup/login creates local browser sessions and local profile/progress state.
- Course and quiz data can load from Convex when configured, or from the local fallback catalog when Convex is absent.
- Premium plan CTAs stay unavailable until paid access is implemented.

## Convex

To connect the real Convex data layer:

```bash
npm run convex:dev
npm run convex:codegen
```

Then copy the generated `NEXT_PUBLIC_CONVEX_URL` and `CONVEX_DEPLOYMENT` values into `.env.local`.

If `NEXT_PUBLIC_CONVEX_URL` is missing, IntellectX intentionally falls back to `src/data` catalog data and local browser state for learner sessions, profile data, course selections, and quiz attempts.

## Environment Variables

Create `.env.local` from `.env.example`.

Free-MVP defaults:

- `NEXT_PUBLIC_PAYMENTS_ENABLED=false`

Optional for Convex persistence:

- `CONVEX_DEPLOYMENT`
- `NEXT_PUBLIC_CONVEX_URL`

Optional future checkout variables, unused while payments are disabled:

- `APPLE_TEAM_ID`
- `NEXT_PUBLIC_BUNDLE_IDENTIFIER`
- `NEXT_PUBLIC_APP_REDIRECT_URL`
- `NEXT_PUBLIC_PADDLE_ENV`
- `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`

## Validation

```bash
npm install
npm run test:e2e -- --grep "pricing keeps premium|checkout is disabled"
npm run build
npm run test:e2e
```

`npm run convex:codegen` requires a configured Convex deployment.
