import results from "@/nlp/results/said_vs_felt.json";

/**
 * Typed access to the said-vs-felt NLP results produced by nlp/said_vs_felt.py.
 * These are computed model outputs, not sample data: NLI contradiction and
 * GoEmotions emotional divergence over the hand-labeled evaluation set in
 * nlp/data/. Re-running the pipeline regenerates the JSON and the app follows.
 */

export type SaidVsFeltLabel = "aligned" | "masked" | "contradicting";

export interface EmotionScore {
  label: string;
  score: number;
}

export interface SaidVsFeltExchange {
  id: string;
  scenario: string;
  stimulus: string;
  inner_monologue: string;
  verbal_response: string;
  core_value: string;
  /** Human-assigned label. */
  label: SaidVsFeltLabel;
  /** Model verdict. */
  predicted: SaidVsFeltLabel;
  contradiction: number;
  emotional_divergence: number;
  divergence_score: number;
  lexical_distance: number;
  felt_emotions: EmotionScore[];
  expressed_emotions: EmotionScore[];
}

export interface SaidVsFeltMeta {
  generated_at: string;
  models: { nli: string; emotion: string };
  n_exchanges: number;
  thresholds: { contradiction: number; emotional_divergence: number };
  metrics: {
    auroc: {
      divergent_vs_aligned: {
        contradiction: number;
        emotional_divergence: number;
        combined: number;
        lexical_baseline: number;
        lexical_baseline_best_direction: number;
      };
      contradicting_vs_rest: {
        contradiction: number;
        lexical_baseline: number;
        lexical_baseline_best_direction: number;
      };
      masked_vs_aligned: {
        emotional_divergence: number;
        lexical_baseline: number;
        lexical_baseline_best_direction: number;
      };
    };
    three_way: { accuracy_leave_one_out: number; majority_baseline: number };
  };
}

export const saidVsFelt = results as unknown as {
  meta: SaidVsFeltMeta;
  exchanges: SaidVsFeltExchange[];
};

const exchangesById = new Map(saidVsFelt.exchanges.map((ex) => [ex.id, ex]));

export function getExchange(id: string): SaidVsFeltExchange | undefined {
  return exchangesById.get(id);
}

export const VERDICT_TEXT: Record<SaidVsFeltLabel, string> = {
  aligned: "Aligned",
  masked: "Masked feeling",
  contradicting: "Lie detected",
};
