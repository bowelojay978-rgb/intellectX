import { elevatedGlassCardClassName } from "@/components/education/glass-card";

type LegalSection = {
  title: string;
  body: string[];
};

type LegalPageProps = {
  title: string;
  description: string;
  sections: LegalSection[];
};

export function LegalPage({ title, description, sections }: LegalPageProps) {
  return (
    <main className="relative mx-auto w-full max-w-3xl py-12">
      <section className="mb-10 text-center">
        <p className="text-muted-foreground mb-3 text-sm font-medium uppercase tracking-normal">IntellectX</p>
        <h1 className="text-4xl leading-[1.1] font-medium tracking-tight sm:text-5xl">{title}</h1>
        <p className="text-muted-foreground mx-auto mt-4 max-w-2xl leading-7">{description}</p>
      </section>
      <article className={`rounded-lg p-6 leading-7 md:p-8 ${elevatedGlassCardClassName}`}>
        <p className="text-muted-foreground mb-8 text-sm">Effective date: June 28, 2026</p>
        <div className="space-y-8">
          {sections.map((section) => (
            <section key={section.title} className="space-y-3">
              <h2 className="text-xl font-semibold tracking-tight">{section.title}</h2>
              {section.body.map((paragraph) => (
                <p key={paragraph} className="text-muted-foreground">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}
