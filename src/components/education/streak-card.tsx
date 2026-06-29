import { glassCardClassName } from "@/components/education/glass-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FlameIcon } from "lucide-react";

type StreakCardProps = {
  compact?: boolean;
  hasActivity?: boolean;
};

export function StreakCard({ compact = false, hasActivity = false }: StreakCardProps) {
  return (
    <Card className={`rounded-lg ${glassCardClassName}`}>
      <CardHeader className={compact ? "pb-0" : undefined}>
        <CardTitle className="flex items-center gap-2">
          <FlameIcon className="size-5" />
          Study streak
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-3xl font-semibold tracking-tight">{hasActivity ? "Active today" : "No activity yet"}</p>
          <p className="text-muted-foreground text-sm">
            {hasActivity ? "Study activity was recorded today." : "Streak history starts after recorded study activity."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => {
            const active = hasActivity && day === new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(new Date());
            return (
              <span
                key={day}
                className={`grid size-9 place-items-center rounded-full text-xs font-medium ${
                  active ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                }`}
              >
                {day.slice(0, 1)}
              </span>
            );
          })}
        </div>
        {!compact && (
          <p className="text-muted-foreground text-sm">
            Last studied: {hasActivity ? "Today" : "Not recorded yet"}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
