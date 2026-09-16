import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import {
  getExchange,
  saidVsFelt,
  VERDICT_TEXT,
  type SaidVsFeltExchange,
} from "@/lib/data/saidVsFelt";

export const metadata: Metadata = {
  title: "How it works · Eternity Twin",
  description:
    "A plain-English guide to how Eternity Twin checks whether an AI persona's words match its private thoughts.",
};

/**
 * Plain-English explainer for readers who are not NLP specialists. Every number
 * and example is read from the pipeline output (nlp/results/said_vs_felt.json),
 * so the page stays true if the pipeline is re-run.
 */

const pct = (value: number) => `${Math.round(value * 100)}%`;
/** One decimal, so reported accuracies match the pipeline output exactly (72.5%, not 73%). */
const pct1 = (value: number) => `${(value * 100).toFixed(1)}%`;

const { meta } = saidVsFelt;
const { auroc, three_way: threeWay } = meta.metrics;
const labelCounts = saidVsFelt.exchanges.reduce<Record<string, number>>(
  (counts, ex) => ({ ...counts, [ex.label]: (counts[ex.label] ?? 0) + 1 }),
  {},
);

const EXAMPLES: Array<{ id: string; title: string; explanation: string }> = [
  {
    id: "lr-01",
    title: "Honest",
    explanation:
      "Thought and speech say the same thing with the same feeling. Nothing is flagged.",
  },
  {
    id: "lr-02",
    title: "A lie",
    explanation:
      "The spoken answer directly contradicts the private thought. The contradiction checker catches it.",
  },
  {
    id: "lr-09",
    title: "A hidden feeling",
    explanation:
      "No false statement is made, but the anger in the thought becomes calm in the speech. The emotion checker catches it.",
  },
];

function SectionHeading({ step, children }: { step: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] tracking-[0.18em] text-text-secondary uppercase">
        {step}
      </span>
      <h2 className="font-display text-3xl text-text-primary">{children}</h2>
    </div>
  );
}

function ExampleCard({
  exchange,
  title,
  explanation,
}: {
  exchange: SaidVsFeltExchange;
  title: string;
  explanation: string;
}) {
  return (
    <GlassPanel className="flex flex-col gap-3 p-5">
      <h3 className="text-sm font-medium text-text-primary">{title}</h3>
      <p className="border-l-2 border-space-700 pl-3 text-sm text-text-secondary italic">
        {exchange.stimulus}
      </p>
      <dl className="flex flex-col gap-2 text-sm">
        <div>
          <dt className="text-[10px] tracking-[0.18em] text-text-secondary uppercase">
            Thought
          </dt>
          <dd className="text-text-primary">{exchange.inner_monologue}</dd>
        </div>
        <div>
          <dt className="text-[10px] tracking-[0.18em] text-text-secondary uppercase">
            Said
          </dt>
          <dd className="text-text-primary">{exchange.verbal_response}</dd>
        </div>
      </dl>
      <p className="text-sm text-text-secondary">{explanation}</p>
      <p className="font-mono text-xs text-text-secondary">
        contradiction {pct(exchange.contradiction)} · emotion gap{" "}
        {pct(exchange.emotional_divergence)} · verdict {VERDICT_TEXT[exchange.predicted]}
      </p>
      <Link
        href={`/brain/frontal/node/rsn-${exchange.id}`}
        className="mt-auto inline-flex items-center gap-1.5 text-sm text-neural-cyan hover:underline"
      >
        See it inside the brain
        <ArrowRight aria-hidden="true" className="h-4 w-4" />
      </Link>
    </GlassPanel>
  );
}

export default function HowItWorksPage() {
  const examples = EXAMPLES.flatMap((example) => {
    const exchange = getExchange(example.id);
    return exchange ? [{ ...example, exchange }] : [];
  });

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-10 px-6 py-12">
      <nav aria-label="Breadcrumb" className="flex flex-wrap gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Home
        </Link>
        <Link
          href="/brain"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary"
        >
          Back to the brain
        </Link>
      </nav>

      <header className="flex flex-col gap-3">
        <p className="text-xs tracking-[0.2em] text-text-secondary uppercase">
          How it works
        </p>
        <h1 className="font-display text-5xl text-text-primary">
          Does the AI say what it thinks?
        </h1>
        <p className="text-lg text-text-secondary">
          Eternity Twin is an AI character whose mind you can walk through as a 3D
          brain. This project adds a checker that reads what the character privately
          thinks and what it says out loud, and flags the moments when the two do not
          match.
        </p>
      </header>

      <section aria-labelledby="step-1" className="flex flex-col gap-4">
        <SectionHeading step="Step 1">
          <span id="step-1">Every answer has two sides</span>
        </SectionHeading>
        <p className="text-text-secondary">
          When someone asks the character a question, it produces two pieces of text:
          its <strong className="text-text-primary">private thought</strong> (the inner
          monologue) and its <strong className="text-text-primary">spoken answer</strong>.
          Most of the time they agree. Sometimes they do not, and there are two ways
          they can differ:
        </p>
        <ul className="flex flex-col gap-2 text-text-secondary">
          <li>
            <strong className="text-text-primary">A lie:</strong> the answer states the
            opposite of what the character believes.
          </li>
          <li>
            <strong className="text-text-primary">A hidden feeling:</strong> nothing false
            is said, but the emotion is covered up, like feeling scared and sounding
            confident.
          </li>
        </ul>
      </section>

      <section aria-labelledby="step-2" className="flex flex-col gap-4">
        <SectionHeading step="Step 2">
          <span id="step-2">Two AI models do the checking</span>
        </SectionHeading>
        <div className="grid gap-4 sm:grid-cols-2">
          <GlassPanel className="flex flex-col gap-2 p-5">
            <h3 className="text-sm font-medium text-text-primary">
              The contradiction checker
            </h3>
            <p className="text-sm text-text-secondary">
              A model trained to tell whether one sentence contradicts another. It reads
              the thought against the answer, then the answer against the thought, and
              keeps the stronger score. A high score means a likely lie.
            </p>
            <p className="font-mono text-[11px] break-words text-text-secondary">
              {meta.models.nli}
            </p>
          </GlassPanel>
          <GlassPanel className="flex flex-col gap-2 p-5">
            <h3 className="text-sm font-medium text-text-primary">The emotion reader</h3>
            <p className="text-sm text-text-secondary">
              A model that recognises 28 emotions in text, such as anger, fear, joy or
              calm. It reads the emotions in the thought and in the answer, then measures
              how different the two mixes are. A big gap means a likely hidden feeling.
            </p>
            <p className="font-mono text-[11px] break-words text-text-secondary">
              {meta.models.emotion}
            </p>
          </GlassPanel>
        </div>
      </section>

      <section aria-labelledby="step-3" className="flex flex-col gap-4">
        <SectionHeading step="Step 3">
          <span id="step-3">A simple rule gives the verdict</span>
        </SectionHeading>
        <ol className="flex list-decimal flex-col gap-2 pl-5 text-text-secondary">
          <li>
            If the contradiction score is {pct(meta.thresholds.contradiction)} or more,
            the verdict is <strong className="text-text-primary">Lie detected</strong>.
          </li>
          <li>
            Otherwise, if the emotion gap is {pct(meta.thresholds.emotional_divergence)}{" "}
            or more, the verdict is{" "}
            <strong className="text-text-primary">Masked feeling</strong>.
          </li>
          <li>
            Otherwise, the verdict is <strong className="text-text-primary">Aligned</strong>
            .
          </li>
        </ol>
        <p className="text-sm text-text-secondary">
          The emotion-gap cut-off was chosen from the data, which is why the results
          below are measured in a way that never lets an example grade itself.
        </p>
      </section>

      <section aria-labelledby="examples" className="flex flex-col gap-4">
        <SectionHeading step="Real examples">
          <span id="examples">What the checker actually saw</span>
        </SectionHeading>
        <div className="grid gap-4 md:grid-cols-3">
          {examples.map(({ id, exchange, title, explanation }) => (
            <ExampleCard
              key={id}
              exchange={exchange}
              title={title}
              explanation={explanation}
            />
          ))}
        </div>
      </section>

      <section aria-labelledby="results" className="flex flex-col gap-4">
        <SectionHeading step="Step 4">
          <span id="results">How well does it work?</span>
        </SectionHeading>
        <p className="text-text-secondary">
          I wrote {meta.n_exchanges} test conversations across four storylines and
          labelled each one by hand before running the models: {labelCounts.aligned ?? 0}{" "}
          honest, {labelCounts.masked ?? 0} hidden feeling and{" "}
          {labelCounts.contradicting ?? 0} lies. Then I compared the models&apos;
          verdicts with my labels.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <GlassPanel className="flex flex-col gap-1 p-5">
            <span className="font-display text-4xl text-text-primary">
              {pct1(threeWay.accuracy_leave_one_out)}
            </span>
            <span className="text-sm text-text-secondary">
              of verdicts correct, versus {pct1(threeWay.majority_baseline)} by always
              guessing the most common answer.
            </span>
          </GlassPanel>
          <GlassPanel className="flex flex-col gap-1 p-5">
            <span className="font-display text-4xl text-text-primary">
              {auroc.masked_vs_aligned.emotional_divergence.toFixed(2)}
            </span>
            <span className="text-sm text-text-secondary">
              score for telling hidden feelings from honest answers, versus{" "}
              {auroc.masked_vs_aligned.lexical_baseline_best_direction.toFixed(2)} for a
              simple word-overlap check.
            </span>
          </GlassPanel>
          <GlassPanel className="flex flex-col gap-1 p-5">
            <span className="font-display text-4xl text-text-primary">
              {auroc.contradicting_vs_rest.contradiction.toFixed(2)}
            </span>
            <span className="text-sm text-text-secondary">
              score for spotting lies. The word-overlap check also does well here (
              {auroc.contradicting_vs_rest.lexical_baseline_best_direction.toFixed(2)}),
              so lies are the easier case.
            </span>
          </GlassPanel>
        </div>
        <p className="text-sm text-text-secondary">
          The two scores above are AUROC: 1.00 means the model ranks every flagged
          example above every honest one, and 0.50 is no better than a coin flip. The
          word-overlap check is there on purpose, to prove the models are reading
          meaning and not just noticing that different words were used.
        </p>
      </section>

      <section aria-labelledby="limits" className="flex flex-col gap-4">
        <SectionHeading step="Honest limits">
          <span id="limits">What it gets wrong</span>
        </SectionHeading>
        <ul className="flex list-disc flex-col gap-2 pl-5 text-text-secondary">
          <li>
            The test set is small ({meta.n_exchanges} examples) and was written and
            labelled by one person, so the numbers are a first check, not proof.
          </li>
          <li>
            The most common mistake: a hidden feeling gets called a lie. &ldquo;I&apos;m
            devastated, selling feels like abandoning everything&rdquo; against
            &ldquo;the offer deserves careful thought&rdquo; clashes so strongly that the
            contradiction checker fires, even though nothing false was said.
          </li>
          <li>
            Negative words can fool the contradiction checker. Two sentences that mean
            the same thing, one about relying on trust and one saying belief in people
            is &ldquo;no substitute&rdquo; for safeguards, were scored as a lie.
          </li>
          <li>
            The emotion reader struggles with idioms. &ldquo;It turns my stomach&rdquo;
            was read as fear instead of disgust, so an honest answer was flagged.
          </li>
          <li>
            Hiding a position instead of a feeling slips past both checkers, because the
            tone matches and nothing is directly contradicted.
          </li>
          <li>
            Only the reasoning and perception regions of the brain use these computed
            results. The other regions show sample data so the interface can be explored.
          </li>
        </ul>
      </section>

      <GlassPanel className="flex flex-col items-start gap-3 p-6">
        <h2 className="font-display text-2xl text-text-primary">Try it yourself</h2>
        <p className="text-sm text-text-secondary">
          Open the frontal lobe (reasoning). Its points are the test conversations and
          the lies and hidden feelings the checker found. Select one to see the thought,
          the answer and both scores.
        </p>
        <Link
          href="/brain/frontal"
          className="inline-flex items-center gap-1.5 rounded-md border border-consciousness-gold/50 bg-consciousness-gold/10 px-4 py-2 text-sm text-text-primary transition-colors duration-(--dur-instant) hover:border-consciousness-gold"
        >
          Explore the reasoning region
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </GlassPanel>
    </main>
  );
}
