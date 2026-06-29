import { FeaturesCarousel } from "@/components/features/features-carousel";
import { FeaturesTabs } from "@/components/features/features-tabs";
import { Badge } from "@/components/ui/badge";
import { FileQuestionIcon, FileTextIcon, PlaySquareIcon } from "lucide-react";

export type FeatureVisualType = "notes" | "quizzes" | "videos";

export type Feature = {
  icon: React.ReactNode;
  title: string;
  description: string;
  visual: FeatureVisualType;
};

const features = [
  {
    icon: <FileTextIcon size={20} />,
    title: "Instructor Notes",
    description: "Review structured explanations and worked examples attached to each lesson.",
    visual: "notes",
  },
  {
    icon: <FileQuestionIcon size={20} />,
    title: "Quiz Practice",
    description: "Answer focused questions and see feedback while the concept is still fresh.",
    visual: "quizzes",
  },
  {
    icon: <PlaySquareIcon size={20} />,
    title: "Video Lessons",
    description: "Move through guided video playlists with lesson material kept in context.",
    visual: "videos",
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
