import { glassCardClassName } from "@/components/education/glass-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { userProgress } from "@/data/user-progress";
import { FlameIcon } from "lucide-react";

type StreakCardProps = {
  compact?: boolean;
};

export function StreakCard({ compact = false }: StreakCardProps) {
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
          <p className="text-3xl font-semibold tracking-tight">{userProgress.studyStreak} days</p>
          <p className="text-muted-foreground text-sm">Longest streak: {userProgress.longestStreak} days</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => {
            const active = userProgress.weeklyActiveDays.includes(day);
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
          <p className="text-muted-foreground text-sm">Last studied: {userProgress.lastStudiedDate}</p>
        )}
      </CardContent>
    </Card>
  );
}
