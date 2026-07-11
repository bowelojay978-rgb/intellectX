import { VideoPlayer } from "@/components/education/video-player";
import { cn } from "@/lib/utils";
import type { Lesson } from "@/data/lessons";
import { PlayIcon } from "lucide-react";
import Link from "next/link";

type LessonVideoLayoutProps = {
  currentLesson: Lesson;
  courseTitle: string;
  lessons: Lesson[];
};

export function LessonVideoLayout({ currentLesson, courseTitle, lessons }: LessonVideoLayoutProps) {
  const sideLessons = lessons.filter((lesson) => lesson.id !== currentLesson.id);

  return (
    <section
      aria-label={`${courseTitle} lesson videos`}
      className={cn(
        "hidden lg:grid lg:items-start lg:gap-5",
        sideLessons.length > 0 ? "lg:grid-cols-[minmax(0,1fr)_22rem]" : "lg:grid-cols-1",
      )}
    >
      <div className="min-w-0">
        <VideoPlayer
          title={currentLesson.title}
          videoUrl={currentLesson.videoUrl}
          posterUrl={currentLesson.posterUrl}
        />
      </div>

      {sideLessons.length > 0 ? (
        <aside aria-label="More lesson videos" className="max-h-[36rem] min-w-0 overflow-y-auto pr-1">
          <div className="grid gap-2">
            {sideLessons.map((lesson) => (
              <Link
                key={lesson.id}
                href={`/learn/${lesson.id}`}
                className="group grid grid-cols-[9rem_minmax(0,1fr)] gap-3 rounded-xl p-2 transition-colors hover:bg-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="relative aspect-video overflow-hidden rounded-lg bg-black">
                  {lesson.posterUrl ? (
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-[1.03]"
                      style={{ backgroundImage: `url(\"${lesson.posterUrl}\")` }}
                    />
                  ) : (
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.28),_transparent_38%),linear-gradient(135deg,_#050505,_#1f2937)]"
                    />
                  )}

                  <span className="absolute inset-0 grid place-items-center bg-black/0 transition-colors group-hover:bg-black/25">
                    <span className="grid size-9 scale-90 place-items-center rounded-full bg-black/75 text-white opacity-0 transition-all group-hover:scale-100 group-hover:opacity-100">
                      <PlayIcon className="ml-0.5 size-4 fill-current" />
                    </span>
                  </span>

                  <span className="absolute right-1.5 bottom-1.5 rounded bg-black/80 px-1.5 py-0.5 text-[11px] font-medium text-white">
                    {lesson.duration}
                  </span>
                </div>

                <div className="min-w-0 py-0.5">
                  <h3 className="line-clamp-2 text-sm leading-5 font-semibold tracking-tight group-hover:text-primary">
                    {lesson.title}
                  </h3>
                  <p className="text-muted-foreground mt-1 line-clamp-1 text-xs">{courseTitle}</p>
                  <p className="text-muted-foreground mt-1 text-xs">Lesson video</p>
                </div>
              </Link>
            ))}
          </div>
        </aside>
      ) : null}
    </section>
  );
}
