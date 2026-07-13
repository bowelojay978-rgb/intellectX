import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckIcon } from "lucide-react";
import { LearnerEntryLink } from "@/components/auth/learner-entry-link";
import Link from "next/link";

const plans = [
  {
    name: "Explorer",
    price: "Free",
    description: "Start with focused learning paths, quizzes, progress tracking, and local study momentum.",
    features: ["Browse available courses", "Try lesson and quiz flows", "View learning dashboard stats"],
    cta: "Start Free",
    href: "/signup",
    available: true,
  },
  {
    name: "Scholar",
    price: "$12",
    description: "Premium tutoring, deeper adaptive planning, and account-backed paid access are being prepared.",
    features: ["Adaptive study planning", "Expanded AI quiz practice", "Saved progress and profile insights"],
    cta: "Coming Soon",
    href: null,
    available: false,
  },
];

export function Plans() {
  return (
    <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center">
      <h1 className="mt-12 mb-4 text-center text-3xl font-bold tracking-tight md:text-5xl">
        Learning plans for focused growth
      </h1>
      <p className="text-muted-foreground mb-10 max-w-xl text-center leading-6">
        Start free while premium account access and payment activation are finalized.
      </p>
      <div className="grid w-full gap-5 md:grid-cols-2">
        {plans.map((plan) => (
          <Card key={plan.name} className="rounded-lg border-white/70 bg-white/75 shadow-3xl backdrop-blur">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <p className="text-muted-foreground text-sm">{plan.name}</p>
                {!plan.available && (
                  <span className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground">
                    Not live yet
                  </span>
                )}
              </div>
              <CardTitle className="text-4xl tracking-tight">
                {plan.price}
                {plan.price !== "Free" && <span className="text-muted-foreground text-base font-normal">/mo</span>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground text-sm leading-6">{plan.description}</p>
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="text-foreground/70 flex items-center text-sm">
                    <div className="bg-success mr-2 grid place-items-center rounded-full p-0.5">
                      <CheckIcon className="size-4 p-0.5 text-white" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              {plan.href ? (
                <Button className="w-full" size="lg" asChild>
                  {plan.href === "/signup" ? (
                    <LearnerEntryLink signedInHref="/dashboard" signedInLabel="Open IntellectX">
                      {plan.cta}
                    </LearnerEntryLink>
                  ) : (
                    <Link href={plan.href}>{plan.cta}</Link>
                  )}
                </Button>
              ) : (
                <Button className="w-full" size="lg" disabled>
                  {plan.cta}
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
      <div className="text-muted-foreground mt-8 flex justify-center gap-8 text-sm underline">
        <Link href="/privacy-policy">Privacy Policy</Link>
        <Link href="/terms-and-conditions">Terms and Conditions</Link>
        <Link href="/refund-policy">Refund Policy</Link>
      </div>
    </div>
  );
}
