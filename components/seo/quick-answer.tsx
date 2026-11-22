/**
 * Direct-answer "Quick answer" box (AI Overview readiness, Nov 2026).
 *
 * A short, visible answer to the page's core question, placed near the top
 * of the page so readers (and AI Overviews) get the answer first. The answer
 * must always be existing site copy passed in by the caller: never invent
 * claims, prices, metrics or testimonials here.
 *
 * House rule: no em-dash anywhere. Stored copy (e.g. service short
 * descriptions) sometimes contains one, so the box swaps it for a comma
 * instead of changing the stored text.
 */
export function QuickAnswer({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  const clean = answer.replace(/ — /g, ", ").replace(/—/g, ", ");
  if (!question || !clean) return null;
  return (
    <section
      aria-label="Quick answer"
      className="border-b border-border bg-secondary/40 py-10"
    >
      <div className="container-page max-w-3xl">
        <div className="rounded-2xl border border-primary/25 bg-card p-6 shadow-[var(--shadow-card)] sm:p-7">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
            Quick answer
          </p>
          <h2 className="mt-2 font-sans text-xl font-extrabold tracking-tight text-foreground">
            {question}
          </h2>
          <p className="mt-2 leading-relaxed text-muted-foreground">{clean}</p>
        </div>
      </div>
    </section>
  );
}
