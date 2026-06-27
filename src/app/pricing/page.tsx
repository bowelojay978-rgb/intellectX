import { Nav } from "@/components/hero/nav";
import { Plans } from "@/components/pricing/plans";
import { RadialBlur } from "@/components/pricing/radial-blur";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing - IntellectX",
  description: "Mock education pricing for the IntellectX prototype",
};

export default function Pricing() {
  return (
    <div className="bg-card isolate flex h-full min-h-screen w-full flex-col px-8 pt-28 pb-8">
      <RadialBlur />
      <Nav />
      <Plans />
    </div>
  );
}
