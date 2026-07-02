import { LocalProfileContent } from "@/components/education/local-profile-content";
import { PageShell } from "@/components/education/page-shell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile - IntellectX",
  description: "View IntellectX learner profile details, study preferences, and session status.",
};

export default function ProfilePage() {
  return (
    <PageShell>
      <LocalProfileContent />
    </PageShell>
  );
}
