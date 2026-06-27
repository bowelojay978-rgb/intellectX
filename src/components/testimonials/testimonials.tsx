import { Badge } from "@/components/ui/badge";
import { TestimonialMarquee } from "@/components/testimonials/testimonial-marquee";

export type Testimonial = {
  name: string;
  date: string;
  title: string;
  content: string;
  avatar?: string;
  rating: number;
};

const testimonials = [
  {
    name: "Giana Herwitz",
    date: "May 4",
    title: "Revision finally clicked",
    content: `"The lesson-to-quiz flow helped me stop rereading and start proving what I actually knew."`,
    rating: 5,
  },
  {
    name: "Hanna Gouse",
    date: "May 4",
    title: "Calmer exam prep",
    content: `"My dashboard made the next study step obvious, which removed a lot of last-minute stress."`,
    rating: 5,
  },
  {
    name: "Kaiya Donin",
    date: "May 4",
    title: "Great for deep work",
    content: `"The AI prompts feel like a patient tutor instead of another answer machine."`,
    rating: 5,
  },
  {
    name: "Alex Bergwijn",
    date: "May 4",
    title: "Sharp progress view",
    content: `"I can see what I studied, where I missed questions, and what to continue next."`,
    rating: 5,
  },
] satisfies Testimonial[];

export function Testimonials() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-6 py-14 md:py-25">
      <Badge variant="secondary" className="mb-2 uppercase">
        Testimonial
      </Badge>
      <h2 className="text-center text-3xl leading-[1.1] font-medium tracking-tight sm:text-5xl">
        Learners build<div className="text-muted-foreground">real momentum</div>
      </h2>
      <p className="mb-3 max-w-lg text-center leading-6 tracking-tight sm:text-xl lg:mb-8">
        A premium study experience for people who want clarity, focus, and useful feedback after every session.
      </p>
      <div className="relative w-[calc(100%+3rem)] overflow-x-hidden py-4 lg:w-full">
        <TestimonialMarquee testimonials={testimonials} className="mb-4" />
        <TestimonialMarquee testimonials={testimonials} reverse />
      </div>
    </div>
  );
}
