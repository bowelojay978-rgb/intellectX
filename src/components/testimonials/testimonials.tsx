import { Badge } from "@/components/ui/badge";

export type Testimonial = {
  name: string;
  date: string;
  title: string;
  content: string;
  avatar?: string;
  rating: number;
};

const productPrinciples = [
  {
    title: "Learn with context",
    content: "Keep instructor notes, lesson material, and video playlists attached to the lesson flow.",
  },
  {
    title: "Test understanding",
    content: "Use focused quiz questions, explanations after submission, and a final review when the quiz ends.",
  },
  {
    title: "See honest progress",
    content: "Track real lesson activity and quiz history without placeholder percentages or invented enrolment data.",
  },
  {
    title: "Ask for focused help",
    content: "AI support is designed to stay lesson-scoped and hint-first instead of becoming a generic answer machine.",
  },
];

export function Testimonials() {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-6 py-14 md:py-25">
      <Badge variant="secondary" className="mb-2 uppercase">
        Study experience
      </Badge>
      <h2 className="text-center text-3xl leading-[1.1] font-medium tracking-tight sm:text-5xl">
        Built for<div className="text-muted-foreground">clearer next moves</div>
      </h2>
      <p className="mb-3 max-w-lg text-center leading-6 tracking-tight sm:text-xl lg:mb-8">
        Every learner-facing surface is designed to reduce noise, keep feedback close to the work, and make the next
        study action easier to see.
      </p>
      <div className="grid w-full gap-4 md:grid-cols-2">
        {productPrinciples.map((principle) => (
          <article key={principle.title} className="bg-card rounded-xl border p-7 shadow-sm md:p-8">
            <h3 className="text-lg font-semibold">{principle.title}</h3>
            <p className="text-muted-foreground mt-3 text-sm leading-6 md:text-base">{principle.content}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
