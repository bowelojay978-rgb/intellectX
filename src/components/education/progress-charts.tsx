import { glassCardClassName } from "@/components/education/glass-card";
import { SubjectMark } from "@/components/education/subject-mark";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Course } from "@/data/courses";

type ProgressChartsProps = {
  courses: Course[];
  completion: number;
};

const rhythmPoints = [42, 58, 52, 74, 68, 86, 82];
const labels = ["M", "T", "W", "T", "F", "S", "S"];
const chartHeight = 160;
const chartBottom = 192;
const gridLines = [0, 25, 50, 75, 100];

export function ProgressCharts({ courses, completion }: ProgressChartsProps) {
  const linePath = rhythmPoints
    .map((value, index) => {
      const x = 16 + index * 42;
      const y = 112 - value;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
  const remaining = 100 - completion;
  const circumference = 2 * Math.PI * 42;

  return (
    <section className="mb-8 grid gap-5 lg:grid-cols-[1fr_0.75fr]">
      <Card className={`animate-widget rounded-lg ${glassCardClassName}`}>
        <CardHeader>
          <CardTitle>Learning rhythm</CardTitle>
        </CardHeader>
        <CardContent>
          <svg viewBox="0 0 300 130" className="h-44 w-full overflow-visible" role="img" aria-label="Accuracy trend">
            <defs>
              <linearGradient id="trend" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0.85" />
              </linearGradient>
            </defs>
            {[30, 60, 90].map((y) => (
              <line key={y} x1="16" x2="270" y1={y} y2={y} className="stroke-border" strokeWidth="1" />
            ))}
            <path d={linePath} fill="none" stroke="url(#trend)" strokeLinecap="round" strokeWidth="4" />
            {rhythmPoints.map((value, index) => (
              <g key={labels[index] + index}>
                <circle cx={16 + index * 42} cy={112 - value} r="4" className="fill-foreground" />
                <text x={16 + index * 42} y="124" textAnchor="middle" className="fill-muted-foreground text-[10px]">
                  {labels[index]}
                </text>
              </g>
            ))}
          </svg>
        </CardContent>
      </Card>
      <Card className={`animate-widget animate-widget-delay-1 rounded-lg ${glassCardClassName}`}>
        <CardHeader>
          <CardTitle>Completion breakdown</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center">
          <div className="relative">
            <svg viewBox="0 0 110 110" className="size-44 -rotate-90" role="img" aria-label="Completion donut">
              <circle cx="55" cy="55" r="42" fill="none" className="stroke-secondary" strokeWidth="14" />
              <circle
                cx="55"
                cy="55"
                r="42"
                fill="none"
                className="stroke-foreground"
                strokeLinecap="round"
                strokeWidth="14"
                strokeDasharray={`${(completion / 100) * circumference} ${circumference}`}
              />
              <circle
                cx="55"
                cy="55"
                r="25"
                fill="none"
                className="stroke-muted"
                strokeDasharray={`${(remaining / 100) * 157} 157`}
                strokeWidth="4"
              />
            </svg>
            <div className="absolute inset-0 grid place-items-center text-center">
              <div>
                <p className="text-3xl font-semibold">{completion}%</p>
                <p className="text-muted-foreground text-xs">complete</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className={`animate-widget animate-widget-delay-2 rounded-lg lg:col-span-2 ${glassCardClassName}`}>
        <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Subject progress</CardTitle>
            <p className="text-muted-foreground mt-2 text-sm">Completion against the remaining study scope.</p>
          </div>
          <div className="text-muted-foreground flex flex-wrap gap-3 text-xs">
            <span className="inline-flex items-center gap-2">
              <span className="bg-foreground size-2 rounded-full" />
              Complete
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="bg-secondary ring-border size-2 rounded-full ring-1" />
              Open
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto pb-2">
            <svg
              viewBox="0 0 720 260"
              className="h-72 w-full min-w-[640px]"
              role="img"
              aria-label="Grouped bar chart of subject completion and remaining work"
            >
              {gridLines.map((value) => {
                const y = chartBottom - (value / 100) * chartHeight;

                return (
                  <g key={value}>
                    <line x1="54" x2="690" y1={y} y2={y} className="stroke-border" strokeWidth="1" />
                    <text x="34" y={y + 4} textAnchor="end" className="fill-muted-foreground text-[10px]">
                      {value}
                    </text>
                  </g>
                );
              })}
              {courses.map((course, index) => {
                const groupX = 112 + index * 210;
                const completeHeight = (course.progress / 100) * chartHeight;
                const openHeight = ((100 - course.progress) / 100) * chartHeight;

                return (
                  <g key={course.id}>
                    <rect
                      x={groupX}
                      y={chartBottom - completeHeight}
                      width="34"
                      height={completeHeight}
                      rx="17"
                      className="fill-foreground"
                    />
                    <rect
                      x={groupX + 46}
                      y={chartBottom - openHeight}
                      width="34"
                      height={openHeight}
                      rx="17"
                      className="fill-secondary stroke-border"
                      strokeWidth="1"
                    />
                    <line
                      x1={groupX - 18}
                      x2={groupX + 98}
                      y1={chartBottom}
                      y2={chartBottom}
                      className="stroke-border"
                    />
                    <text
                      x={groupX + 17}
                      y={chartBottom - completeHeight - 10}
                      textAnchor="middle"
                      className="fill-foreground text-[12px] font-medium"
                    >
                      {course.progress}%
                    </text>
                    <foreignObject x={groupX - 38} y="210" width="156" height="44">
                      <div className="text-muted-foreground flex items-center justify-center gap-2 text-center text-xs">
                        <SubjectMark subject={course.subject} className="size-5 text-[10px]" />
                        <span className="text-foreground font-medium">{course.subject}</span>
                      </div>
                    </foreignObject>
                  </g>
                );
              })}
              <line x1="54" x2="690" y1={chartBottom} y2={chartBottom} className="stroke-border" strokeWidth="1.5" />
            </svg>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
