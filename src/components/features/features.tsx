import { FeaturesCarousel } from "@/components/features/features-carousel";
import { FeaturesTabs } from "@/components/features/features-tabs";
import { Badge } from "@/components/ui/badge";
import { BrainCircuitIcon, ChartNoAxesColumnIcon, LibraryIcon, ZapIcon } from "lucide-react";

export type Feature = {
  icon: React.ReactNode;
  title: string;
  description: string;
  image: string;
};

const features = [
  {
    icon: <BrainCircuitIcon size={20} />,
    title: "AI Study Coach",
    description: "Get guided explanations, sharper prompts, and practice loops tailored to your goals.",
    image: "/app-image-1.png",
  },
  {
    icon: <ZapIcon size={20} />,
    title: "Focused Learning Flow",
    description: "Move from lessons to quizzes to review without losing context or momentum.",
    image: "/app-image-1.png",
  },
  {
    icon: <LibraryIcon size={20} />,
    title: "Premium Course Paths",
    description: "Follow curated tracks across AI productivity, critical thinking, and exam prep.",
    image: "/app-image-1.png",
  },
  {
    icon: <ChartNoAxesColumnIcon size={20} />,
    title: "Progress Intelligence",
    description: "See streaks, quiz scores, recent lessons, and the next best study action.",
    image: "/app-image-1.png",
  },
] satisfies Feature[];

export function Features() {
  return (
    <div id="features" className="flex w-full flex-col items-center gap-6 px-6 py-14 md:px-10 md:py-25">
      <Badge variant="secondary" className="uppercase">
        Features
      </Badge>
      <h2 className="text-center text-3xl leading-[1.1] font-medium tracking-tight sm:text-5xl">
        Study smarter with<div className="text-muted-foreground">AI beside you</div>
      </h2>
      <p className="mb-3 max-w-lg text-center leading-6 tracking-tight sm:text-xl lg:mb-8">
        IntellectX blends structured courses, adaptive checks, and productivity tools into a polished learning
        workspace.
      </p>
      <FeaturesCarousel features={features} className="block lg:hidden" />
      <FeaturesTabs features={features} className="hidden lg:block" />
    </div>
  );
}
