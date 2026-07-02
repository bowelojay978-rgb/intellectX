import { Checkout } from "@/components/checkout/checkout";
import { CheckoutQueryParams, SnakeCaseCheckoutQueryParams } from "@/lib/types";
import { Environments } from "@paddle/paddle-js";
import Link from "next/link";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout - IntellectX",
  description: "IntellectX premium checkout.",
};

type Props = {
  searchParams: Promise<SnakeCaseCheckoutQueryParams>;
};

export default async function CheckoutPage({ searchParams }: Props) {
  const paymentsEnabled = process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === "true";

  if (!paymentsEnabled) {
    return (
      <main className="grid min-h-[70vh] place-items-center px-6 py-16">
        <section className="mx-auto max-w-xl rounded-3xl border border-border bg-background/95 p-8 text-center shadow-sm">
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">Coming soon</p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Premium checkout is not live yet</h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            Start learning for free while premium account access is being finalized.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/courses"
              className="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-6 text-sm font-semibold text-background transition hover:opacity-90"
            >
              Start free
            </Link>
            <Link
              href="/pricing"
              className="inline-flex h-11 items-center justify-center rounded-full border border-border px-6 text-sm font-semibold text-foreground transition hover:bg-muted"
            >
              View pricing
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const clientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
  const redirectUrl = process.env.NEXT_PUBLIC_APP_REDIRECT_URL;
  const environment = process.env.NEXT_PUBLIC_PADDLE_ENV as Environments;

  if (!clientToken || !redirectUrl || !environment) {
    return <div className="grid place-items-center p-8 text-xl">Missing required environment variables</div>;
  }

  const {
    app_user_id: appUserId,
    country_code: countryCode,
    discount_code: discountCode,
    discount_id: discountId,
    locale,
    paddle_customer_id: paddleCustomerId,
    postal_code: postalCode,
    price_id: urlPriceId,
    theme,
    transaction_id: transactionId,
    user_email: userEmail,
  } = await searchParams;

  const checkoutQueryParams: CheckoutQueryParams = {
    appUserId,
    countryCode,
    discountCode,
    discountId,
    locale,
    paddleCustomerId,
    postalCode,
    priceId: urlPriceId,
    theme,
    transactionId,
    userEmail,
  };

  if (!urlPriceId && !transactionId) {
    return <div className="grid place-items-center p-8 text-xl">Missing price ID</div>;
  }

  return (
    <Checkout
      checkoutQueryParams={checkoutQueryParams}
      environment={environment}
      clientToken={clientToken}
      redirectUrl={redirectUrl}
    />
  );
}

