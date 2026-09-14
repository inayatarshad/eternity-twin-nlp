import { Meter } from "@/components/ui/Meter";
import {
  saidVsFelt,
  VERDICT_TEXT,
  type EmotionScore,
  type SaidVsFeltExchange,
} from "@/lib/data/saidVsFelt";

/**
 * Provenance view for nodes backed by the said-vs-felt NLP pipeline: the prompt,
 * what the persona felt versus what it said (with the emotions the GoEmotions
 * model detected in each), both model scores, and the model's verdict next to
 * the human label. Everything here is computed output from nlp/said_vs_felt.py.
 */

function EmotionChips({ emotions }: { emotions: EmotionScore[] }) {
  return (
    <ul className="flex flex-wrap gap-1">
      {emotions.map((emotion) => (
        <li
          key={emotion.label}
          className="rounded-pill border border-space-700 bg-space-800/60 px-2 py-0.5 text-[11px] text-text-secondary"
        >
          {emotion.label}{" "}
          <span className="font-mono">{Math.round(emotion.score * 100)}%</span>
        </li>
      ))}
    </ul>
  );
}

function Voice({
  heading,
  text,
  emotions,
}: {
  heading: string;
  text: string;
  emotions: EmotionScore[];
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-md border border-space-700 bg-space-800/40 p-3">
      <h2 className="text-[10px] tracking-[0.18em] text-text-secondary uppercase">
        {heading}
      </h2>
      <p className="text-sm text-text-primary">{text}</p>
      <EmotionChips emotions={emotions} />
    </div>
  );
}

export function SaidVsFeltPanel({ exchange }: { exchange: SaidVsFeltExchange }) {
  const { models } = saidVsFelt.meta;
  const agrees = exchange.predicted === exchange.label;

  return (
    <section aria-label="Said versus felt analysis" className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <span className="text-[10px] tracking-[0.18em] text-text-secondary uppercase">
          {exchange.scenario} · prompt
        </span>
        <p className="border-l-2 border-space-700 pl-3 text-sm text-text-secondary italic">
          {exchange.stimulus}
        </p>
      </div>

      <Voice
        heading="Felt (inner monologue)"
        text={exchange.inner_monologue}
        emotions={exchange.felt_emotions}
      />
      <Voice
        heading="Said (out loud)"
        text={exchange.verbal_response}
        emotions={exchange.expressed_emotions}
      />

      <div className="flex flex-col gap-2">
        <Meter
          label="Contradiction"
          value={exchange.contradiction}
          accent="var(--color-danger)"
        />
        <Meter
          label="Emotion gap"
          value={exchange.emotional_divergence}
          accent="var(--color-emotion-magenta)"
        />
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex flex-col gap-0.5">
          <dt className="text-[10px] tracking-[0.18em] text-text-secondary uppercase">
            Model verdict
          </dt>
          <dd className="text-text-primary">{VERDICT_TEXT[exchange.predicted]}</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-[10px] tracking-[0.18em] text-text-secondary uppercase">
            Human label
          </dt>
          <dd className="text-text-primary">
            {VERDICT_TEXT[exchange.label]}{" "}
            <span className="text-text-secondary">
              ({agrees ? "model agrees" : "model disagrees"})
            </span>
          </dd>
        </div>
      </dl>

      <p className="text-[11px] leading-relaxed break-words text-text-secondary">
        Computed by {models.nli} (contradiction) and {models.emotion} (emotions) on a
        hand-labeled evaluation set. Exchange {exchange.id}.
      </p>
    </section>
  );
}
