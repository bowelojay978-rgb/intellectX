import { FeatureDetails } from "@/components/features/feature-details";
import { FeatureVisual } from "@/components/features/feature-visual";
import type { Feature } from "@/components/features/features";

type FeatureCardProps = {
  feature: Feature;
  isActive: boolean;
};

export function FeatureCard({ feature, isActive }: FeatureCardProps) {
  return (
    <div className="flex w-[var(--carousel-item-width)] flex-col items-center gap-5 px-2 py-6">
      <FeatureDetails feature={feature} isActive={isActive} />
      <FeatureVisual type={feature.visual} />
    </div>
  );
}
