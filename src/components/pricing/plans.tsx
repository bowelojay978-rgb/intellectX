import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckIcon } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "Explorer",
    price: "Free",
    description: "Preview AI-guided learning with starter courses and progress tracking.",
    features: ["Browse available courses", "Try lesson and quiz flows", "View sample dashboard stats"],
    cta: "Browse Courses",
    href: "/courses",
  },
  {
    name: "Scholar",
    price: "$12",
    description: "A future premium plan for adaptive study plans, richer tutoring, and saved progress.",
    features: ["Adaptive study planning", "Expanded AI quiz practice", "Saved progress and profile insights"],
    cta: "Start Learning",
    href: "/dashboard",
  },
];

export function Plans() {
  return (
    <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center">
      <h1 className="mt-12 mb-4 text-center text-3xl font-bold tracking-tight md:text-5xl">
        Learning plans for focused growth
      </h1>
      <p className="text-muted-foreground mb-10 max-w-xl text-center leading-6">
        Pricing below presents available plan positioning for the education product
        experience.
      </p>
      <div className="grid w-full gap-5 md:grid-cols-2">
        {plans.map((plan) => (
          <Card key={plan.name} className="rounded-lg border-white/70 bg-white/75 shadow-3xl backdrop-blur">
            <CardHeader>
              <p className="text-muted-foreground text-sm">{plan.name}</p>
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
              <Button className="w-full" size="lg" asChild>
                <Link href={plan.href}>{plan.cta}</Link>
              </Button>
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



