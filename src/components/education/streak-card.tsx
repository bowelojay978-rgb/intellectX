import { glassCardClassName } from "@/components/education/glass-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  emptyStudyActivitySummary,
  formatStudyStreakValue,
  studyWeekdayLabels,
  type StudyActivitySummary,
} from "@/lib/study-activity-summary";
import { FlameIcon } from "lucide-react";

type StreakCardProps = {
  compact?: boolean;
  summary?: StudyActivitySummary;
};

export function StreakCard({ compact = false, summary = emptyStudyActivitySummary }: StreakCardProps) {
  const activeDays = new Set(summary.weeklyActiveDayLabels);
  const hasActivity = summary.activeDateCount > 0;

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
          <p className="text-3xl font-semibold tracking-tight">{formatStudyStreakValue(summary)}</p>
          <p className="text-muted-foreground text-sm">
            {hasActivity
              ? summary.isActiveToday
                ? "Study activity was recorded today."
                : "Continue today to extend your streak."
              : "Streak history starts after recorded study activity."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {studyWeekdayLabels.map((day) => {
            const active = activeDays.has(day);

            return (
              <span
                key={day}
                title={day}
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
            Last studied: {summary.lastStudiedLabel}
            {summary.longestStreak > 0 ? ` · Best streak: ${summary.longestStreak} day${summary.longestStreak === 1 ? "" : "s"}` : ""}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
