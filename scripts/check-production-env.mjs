import process from 'node:process';

const args = new Set(process.argv.slice(2));
const strict = args.has('--strict');

const checks = [
  'NEXT_PUBLIC_CONVEX_URL',
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
  'CLERK_JWT_ISSUER_DOMAIN',
  'ALLOW_LOCAL_USERKEY_FALLBACK',
  'NEXT_PUBLIC_PAYMENTS_ENABLED',
];

const criticalChecks = [
  'NEXT_PUBLIC_CONVEX_URL',
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
  'CLERK_JWT_ISSUER_DOMAIN',
];

const results = checks.map((name) => {
  const value = process.env[name];
  const present = typeof value === 'string' && value.trim().length > 0;
  return { name, present };
});

for (const result of results) {
  console.log(`${result.name}: ${result.present ? 'present' : 'missing'}`);
}

const enabledWarnings = [];
if (process.env.ALLOW_LOCAL_USERKEY_FALLBACK === 'true') {
  enabledWarnings.push('ALLOW_LOCAL_USERKEY_FALLBACK is enabled');
}
if (process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === 'true') {
  enabledWarnings.push('NEXT_PUBLIC_PAYMENTS_ENABLED is enabled');
}

for (const warning of enabledWarnings) {
  console.warn(`Warning: ${warning}`);
}

const missingCritical = criticalChecks.filter((name) => {
  const value = process.env[name];
  return typeof value !== 'string' || value.trim().length === 0;
});

if (strict && missingCritical.length > 0) {
  console.error(`Strict check failed: missing critical production auth variables (${missingCritical.join(', ')})`);
  process.exit(1);
}
