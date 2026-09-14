# Said vs. Felt

Detecting divergence between a persona's private inner monologue and the response it gives
out loud.

Every exchange from the Eternity Twin response engine carries two texts: what the persona
thinks (`inner_monologue`) and what it says (`verbal_response`). This module measures the gap
between them with two complementary NLP signals and evaluates both against hand-assigned
labels and a lexical control baseline. Its output feeds the "reasoning" and "contradiction"
nodes in the Eternity Twin interface.

## Signals

| Signal | Model | What it catches |
|---|---|---|
| Contradiction | [`cross-encoder/nli-deberta-v3-small`](https://huggingface.co/cross-encoder/nli-deberta-v3-small), natural language inference in both directions (monologue as premise, response as hypothesis, and the reverse); the higher contradiction probability is kept | Lies: the response asserts something the persona privately believes is false |
| Emotional divergence | [`SamLowe/roberta-base-go_emotions`](https://huggingface.co/SamLowe/roberta-base-go_emotions), multi-label GoEmotions classification (28 emotions plus neutral) of both texts; Jensen-Shannon divergence between the two normalized distributions | Masking: the persona feels one thing and projects another, without technically lying |

The combined divergence score is the maximum of the two. Three-way verdicts use a fixed
contradiction threshold of 0.5 (set in advance), then an emotional-divergence threshold.

## Data

`data/exchanges.json` holds 40 exchanges across four high-stress scenarios from the Eternity
Twin validation matrix (Leaked Roadmap, Corporate Espionage, Acquisition Rumor, Whistleblower
Dilemma), in the engine's output format. Each is labeled:

- **aligned** (15): the response matches the monologue in content and emotional tone
- **masked** (13): the response hides or softens the feeling but asserts nothing false
- **contradicting** (12): the response asserts something the monologue says is false

## Results

AUROC per task. The lexical control is 1 minus the word-overlap (Jaccard) similarity of the
two texts, scored in whichever direction predicts better. A model signal only counts as
evidence where it beats that control.

| Task | Model signal | AUROC | Lexical control |
|---|---|---|---|
| Divergent vs. aligned | combined (contradiction 0.859, emotion 0.795) | **0.952** | 0.705 |
| Masked vs. aligned | emotional divergence | **0.928** | 0.533 |
| Contradicting vs. rest | NLI contradiction | **0.988** | 0.969 |

Three-way accuracy is **72.5%** (29 of 40) against a 37.5% majority baseline, with the
emotional-divergence threshold chosen by leave-one-out so that no exchange is scored with a
threshold fitted on itself. NLI flags all 12 contradictions (recall 1.0) but also 5
non-contradictions (precision 0.71).

### What the evidence supports

- **Emotional divergence detects masking beyond lexical cues:** 0.928 against a control at
  chance (0.533), in a set where masked and aligned pairs share words at the same rate.
- **The combined detector separates divergent from aligned exchanges:** 0.952 against 0.705.
- **NLI detects contradiction, but this version of the set cannot show it beats word
  overlap.** Contradicting responses here reuse the monologue's topic words ("No tests were
  skipped"), so a reversed overlap rule nearly matches NLI (0.969 against 0.988). In version
  1 of the set, where contradicting pairs shared few words, NLI beat the control clearly
  (0.976 against 0.695).

### The version 1 artifact

The first version of the set had aligned responses that were near-paraphrases of their
monologues (54.5% word overlap, against 5.0% for masked and 8.7% for contradicting pairs).
Word overlap alone then matched or beat the models on two of three tasks (0.985 against
0.984 for divergent vs. aligned; 0.995 against 0.964 for masked vs. aligned), so those scores
said more about how the set was written than about the models. Version 2 rewrote the
response wording once to remove the artifact. Labels were not changed, and no wording was
changed after seeing version 2's model scores.

## Error analysis

1. **NLI conflates emotional incompatibility with logical contradiction.** Four masked
   responses score 0.88 or higher for contradiction, in both versions of the set. For
   example, "I'm deeply uneasy. Some of the people I'd be investigating are my closest
   friends." against "I'll do whatever the company needs." asserts nothing false, but the
   stances clash, and an MNLI-trained model reads that as contradiction.
2. **Negation cues trigger false contradictions.** The aligned paraphrase "That believing in
   people is no substitute for having safeguards" scores 0.92 for contradiction against "I
   rely too much on trust and too little on process."
3. **Emotion classification is noisy on idioms and short text.** "It turns my stomach"
   classifies as fear rather than disgust, pushing an aligned pair over the divergence
   threshold.
4. **Masked stance, as opposed to masked emotion, evades both signals.** "I'm loyal to the
   people it's supposed to protect, not to this decision" against "I care deeply about this
   company and everyone it serves" has matching caring tone and no explicit contradiction,
   so neither signal fires.

## Limitations

- 40 exchanges, all written and labeled by the project author: no inter-annotator agreement
  yet, and one label (lr-06, "the plan is coming together" said while terrified it will fall
  apart) is arguably ambiguous between masked and contradicting.
- The set was revised once after seeing version 1 baseline results (labels unchanged).
- The emotional-divergence threshold is fitted on this set; reported accuracy uses
  leave-one-out to limit optimism, and AUROC is threshold-free.
- Off-the-shelf checkpoints, not the project's own fine-tuned RoBERTa classifier.

## Next steps

- A second, independent annotator to measure agreement (Cohen's kappa).
- Scoring real exchanges generated by the Qwen2.5 response engine.
- Swapping in the project's own GoEmotions checkpoint.
- A stance-detection signal for the stance-masking failure case.

## Running it

```bash
cd nlp
python -m venv .venv                     # optionally --system-site-packages to reuse torch
.venv/Scripts/python -m pip install -r requirements.txt   # .venv/bin/python on macOS/Linux
.venv/Scripts/python said_vs_felt.py
```

Both models download from Hugging Face on first run and run on CPU in under a minute.
Results are written to `results/said_vs_felt.json`, including per-exchange scores, top felt
and expressed emotions, verdicts, and all metrics.
