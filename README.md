# IntellectX

IntellectX is a premium AI-powered education web app built with Next.js, React, Tailwind CSS, Convex, and the preserved Paddle checkout starter code.

The current app includes a polished learner-facing frontend for courses, lessons, quizzes, progress, dashboard, profile, notes, video placeholders, and study streaks. Convex is being introduced as the production data layer for catalog data while the app keeps a safe local catalog fallback when Convex is not configured.

## Tech Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Convex
- Paddle checkout code preserved for future payment/access work

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

## Convex

To connect the real Convex data layer:

```bash
npm run convex:dev
npm run convex:codegen
```

Then copy the generated `NEXT_PUBLIC_CONVEX_URL` and `CONVEX_DEPLOYMENT` values into `.env.local`.

If `NEXT_PUBLIC_CONVEX_URL` is missing, IntellectX intentionally falls back to `src/data` catalog data and local browser state for notes and quiz attempts.

## Environment Variables

Create `.env.local` from `.env.example`.

Required for Convex persistence:

- `CONVEX_DEPLOYMENT`
- `NEXT_PUBLIC_CONVEX_URL`

Preserved for Paddle checkout:

- `APPLE_TEAM_ID`
- `NEXT_PUBLIC_BUNDLE_IDENTIFIER`
- `NEXT_PUBLIC_APP_REDIRECT_URL`
- `NEXT_PUBLIC_PADDLE_ENV`
- `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`

## Validation

```bash
npm install
npm run convex:codegen
.\node_modules\.bin\tsc.cmd --noEmit
.\node_modules\.bin\next.cmd lint
.\node_modules\.bin\next.cmd build
```

`npm run convex:codegen` requires a configured Convex deployment.
