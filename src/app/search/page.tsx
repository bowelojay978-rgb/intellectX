import { CatalogSearch } from "@/components/education/catalog-search";
import { PageShell } from "@/components/education/page-shell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search - IntellectX",
  description: "Search learner-visible IntellectX courses, lessons, and quizzes.",
};

export default function SearchPage() {
  return (
    <PageShell>
      <CatalogSearch />
    </PageShell>
  );
}
