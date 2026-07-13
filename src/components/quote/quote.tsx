export function Quote() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-title"
      className="mx-auto flex max-w-3xl scroll-mt-28 flex-col items-center px-4 py-12 text-center"
    >
      <p className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.2em]">How it works</p>
      <h2
        id="how-it-works-title"
        className="mt-4 text-3xl leading-[1.1] font-medium tracking-tighter text-balance md:text-5xl md:text-wrap"
      >
        Learn. Test. Review. <span className="text-muted-foreground/70">Continue with a clearer next move.</span>
      </h2>
      <p className="text-muted-foreground mt-8 max-w-2xl text-sm leading-7 md:text-lg">
        Open a focused lesson, test your understanding with a related quiz, review the explanation, and use real
        learning activity to decide what to continue next.
      </p>
    </section>
  );
}
