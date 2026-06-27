import { glassCardClassName } from "@/components/education/glass-card";
import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  label: string;
  value: string;
  icon: LucideIcon;
};

export function StatCard({ label, value, icon: Icon }: StatCardProps) {
  return (
    <Card className={`animate-widget rounded-lg ${glassCardClassName}`}>
      <CardContent className="flex items-center gap-4">
        <div className="bg-secondary grid size-11 place-items-center rounded-full">
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-muted-foreground text-sm">{label}</p>
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
