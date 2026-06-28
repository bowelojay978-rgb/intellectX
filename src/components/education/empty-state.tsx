import { glassCardClassName } from "@/components/education/glass-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

type EmptyStateProps = {
  title: string;
  description: string;
  actionHref: string;
  actionLabel: string;
  icon: LucideIcon;
};

export function EmptyState({ title, description, actionHref, actionLabel, icon: Icon }: EmptyStateProps) {
  return (
    <Card className={`rounded-lg ${glassCardClassName}`}>
      <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
        <span className="bg-secondary text-foreground grid size-11 place-items-center rounded-full">
          <Icon className="size-5" />
        </span>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          <p className="text-muted-foreground mx-auto max-w-md text-sm leading-6">{description}</p>
        </div>
        <Button asChild>
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
