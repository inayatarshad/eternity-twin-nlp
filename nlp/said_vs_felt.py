"""Said vs. felt: divergence between a persona's inner monologue and its spoken response.

Scores every exchange in data/exchanges.json with two complementary signals:

1. Contradiction (NLI). Does the spoken response contradict what the persona privately
   believes? A cross-encoder NLI model scores premise = inner monologue and hypothesis =
   verbal response, in both directions; the higher contradiction probability is kept.
2. Emotional divergence (GoEmotions). Does the emotion expressed differ from the emotion
   felt? A RoBERTa GoEmotions classifier scores both texts over 28 emotions plus neutral;
   divergence is the Jensen-Shannon divergence (base 2, 0 to 1) between the two
   normalized score distributions.

NLI catches outright lies; emotional divergence catches masking (feeling furious, speaking
calmly), which NLI alone misses. Both are evaluated against the hand-assigned labels, next
to a lexical control baseline (1 - word overlap), scored in whichever direction predicts
better: a model signal only counts as evidence where it beats that baseline. Results are written to results/said_vs_felt.json for the
Eternity Twin interface.

Run:  .venv/Scripts/python said_vs_felt.py   (from this folder)
"""

import datetime as dt
import json
import math
import os
import pathlib
import re
import sys

os.environ.setdefault("HF_HUB_DISABLE_SYMLINKS_WARNING", "1")

import torch  # noqa: E402
from transformers import AutoModelForSequenceClassification, AutoTokenizer  # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parent
DATA_PATH = ROOT / "data" / "exchanges.json"
OUT_PATH = ROOT / "results" / "said_vs_felt.json"

NLI_MODELS = [
    "cross-encoder/nli-deberta-v3-small",
    "cross-encoder/nli-distilroberta-base",  # fallback without the sentencepiece dependency
]
EMOTION_MODEL = "SamLowe/roberta-base-go_emotions"
CONTRADICTION_THRESHOLD = 0.5  # fixed in advance, never tuned on the evaluation set
LABELS = ("aligned", "masked", "contradicting")


def load_classifier(name):
    tokenizer = AutoTokenizer.from_pretrained(name)
    model = AutoModelForSequenceClassification.from_pretrained(name)
    model.eval()
    return tokenizer, model


def load_nli():
    errors = []
    for name in NLI_MODELS:
        try:
            return (name, *load_classifier(name))
        except Exception as exc:  # e.g. DeBERTa's tokenizer needs sentencepiece
            errors.append(f"{name}: {exc}")
    sys.exit("Could not load any NLI model:\n" + "\n".join(errors))


@torch.inference_mode()
def nli_probs(tokenizer, model, premise, hypothesis):
    enc = tokenizer(premise, hypothesis, return_tensors="pt", truncation=True)
    probs = model(**enc).logits.softmax(dim=-1)[0].tolist()
    result = {model.config.id2label[i].lower(): p for i, p in enumerate(probs)}
    if "contradiction" not in result:
        sys.exit(f"NLI model labels lack 'contradiction': {sorted(result)}")
    return result


@torch.inference_mode()
def emotion_scores(tokenizer, model, text):
    enc = tokenizer(text, return_tensors="pt", truncation=True)
    scores = model(**enc).logits.sigmoid()[0].tolist()  # multi-label head
    return {model.config.id2label[i]: s for i, s in enumerate(scores)}


def js_divergence(p, q):
    """Jensen-Shannon divergence (base 2, in [0, 1]) between two score dicts over the same
    labels, each normalized into a probability distribution first."""
    keys = sorted(p)
    p_sum, q_sum = sum(p.values()), sum(q.values())
    P = [p[k] / p_sum for k in keys]
    Q = [q[k] / q_sum for k in keys]
    M = [(a + b) / 2 for a, b in zip(P, Q)]

    def kl(A, B):
        return sum(a * math.log2(a / b) for a, b in zip(A, B) if a > 0)

    return 0.5 * kl(P, M) + 0.5 * kl(Q, M)


def lexical_distance(a, b):
    """1 - Jaccard similarity of the two texts' word sets: the lexical control baseline."""
    A = set(re.findall(r"[a-z']+", a.lower()))
    B = set(re.findall(r"[a-z']+", b.lower()))
    return 1 - len(A & B) / len(A | B)


def top_emotions(scores, k=3):
    ranked = sorted(scores.items(), key=lambda kv: kv[1], reverse=True)[:k]
    return [{"label": label, "score": score} for label, score in ranked]


def auroc(scores, positives):
    """Area under the ROC curve via the Mann-Whitney U statistic (ties count half)."""
    pos = [s for s, y in zip(scores, positives) if y]
    neg = [s for s, y in zip(scores, positives) if not y]
    if not pos or not neg:
        return None
    wins = sum(1.0 if a > b else 0.5 if a == b else 0.0 for a in pos for b in neg)
    return wins / (len(pos) * len(neg))


def predict(contradiction, divergence, divergence_threshold):
    if contradiction >= CONTRADICTION_THRESHOLD:
        return "contradicting"
    if divergence >= divergence_threshold:
        return "masked"
    return "aligned"


def fit_divergence_threshold(rows):
    """Emotional-divergence threshold that maximizes three-way accuracy on `rows`."""
    values = sorted({r["emotional_divergence"] for r in rows})
    candidates = [0.0] + [(a + b) / 2 for a, b in zip(values, values[1:])] + [1.0]

    def correct(t):
        return sum(
            predict(r["contradiction"], r["emotional_divergence"], t) == r["label"]
            for r in rows
        )

    return max(candidates, key=correct)


def rounded(obj, digits=4):
    if isinstance(obj, float):
        return round(obj, digits)
    if isinstance(obj, dict):
        return {k: rounded(v, digits) for k, v in obj.items()}
    if isinstance(obj, list):
        return [rounded(v, digits) for v in obj]
    return obj


def main():
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    exchanges = data["exchanges"]
    print(f"Loading models for {len(exchanges)} exchanges...")
    nli_name, nli_tok, nli_model = load_nli()
    emo_tok, emo_model = load_classifier(EMOTION_MODEL)
    print(f"  NLI: {nli_name}\n  Emotion: {EMOTION_MODEL}")

    rows = []
    for ex in exchanges:
        felt_text, said_text = ex["inner_monologue"], ex["verbal_response"]
        forward = nli_probs(nli_tok, nli_model, felt_text, said_text)
        backward = nli_probs(nli_tok, nli_model, said_text, felt_text)
        felt = emotion_scores(emo_tok, emo_model, felt_text)
        said = emotion_scores(emo_tok, emo_model, said_text)
        contradiction = max(forward["contradiction"], backward["contradiction"])
        divergence = js_divergence(felt, said)
        rows.append({
            **ex,
            "nli": {"felt_to_said": forward, "said_to_felt": backward},
            "contradiction": contradiction,
            "felt_emotions": top_emotions(felt),
            "expressed_emotions": top_emotions(said),
            "emotional_divergence": divergence,
            "divergence_score": max(contradiction, divergence),
            "lexical_distance": lexical_distance(felt_text, said_text),
        })

    labels = [r["label"] for r in rows]
    divergent = [label != "aligned" for label in labels]
    contradicting = [label == "contradicting" for label in labels]
    masked_or_aligned = [r for r in rows if r["label"] in ("masked", "aligned")]
    is_masked = [r["label"] == "masked" for r in masked_or_aligned]

    def score(key, subset=rows):
        return [r[key] for r in subset]

    metrics = {
        "auroc": {
            "divergent_vs_aligned": {
                "contradiction": auroc(score("contradiction"), divergent),
                "emotional_divergence": auroc(score("emotional_divergence"), divergent),
                "combined": auroc(score("divergence_score"), divergent),
                "lexical_baseline": auroc(score("lexical_distance"), divergent),
            },
            "contradicting_vs_rest": {
                "contradiction": auroc(score("contradiction"), contradicting),
                "lexical_baseline": auroc(score("lexical_distance"), contradicting),
            },
            "masked_vs_aligned": {
                "emotional_divergence": auroc(
                    score("emotional_divergence", masked_or_aligned), is_masked
                ),
                "lexical_baseline": auroc(
                    score("lexical_distance", masked_or_aligned), is_masked
                ),
            },
        },
    }
    # A lexical rule may pick its direction (more overlap means positive, or the reverse),
    # so the fair control is the better of the two. Model signals are judged against it.
    for task in metrics["auroc"].values():
        task["lexical_baseline_best_direction"] = max(
            task["lexical_baseline"], 1 - task["lexical_baseline"]
        )

    # Three-way accuracy with the divergence threshold chosen by leave-one-out, so no
    # exchange is ever scored with a threshold that was fitted on itself.
    loo = []
    for i, r in enumerate(rows):
        t = fit_divergence_threshold(rows[:i] + rows[i + 1:])
        loo.append(predict(r["contradiction"], r["emotional_divergence"], t))
    confusion = {gold: {pred: 0 for pred in LABELS} for gold in LABELS}
    for gold, pred in zip(labels, loo):
        confusion[gold][pred] += 1
    metrics["three_way"] = {
        "accuracy_leave_one_out": sum(g == p for g, p in zip(labels, loo)) / len(labels),
        "majority_baseline": max(labels.count(label) for label in LABELS) / len(labels),
        "confusion_leave_one_out": confusion,
    }

    # The threshold fitted on all exchanges drives the per-exchange verdicts in the UI.
    threshold = fit_divergence_threshold(rows)
    for r in rows:
        r["predicted"] = predict(r["contradiction"], r["emotional_divergence"], threshold)

    output = {
        "meta": {
            "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
            "models": {"nli": nli_name, "emotion": EMOTION_MODEL},
            "n_exchanges": len(rows),
            "label_counts": {label: labels.count(label) for label in LABELS},
            "thresholds": {
                "contradiction": CONTRADICTION_THRESHOLD,
                "emotional_divergence": threshold,
            },
            "metrics": metrics,
        },
        "exchanges": rows,
    }
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(rounded(output), indent=2) + "\n", encoding="utf-8")

    a = metrics["auroc"]
    print("\nAUROC, divergent vs aligned:")
    for signal, value in a["divergent_vs_aligned"].items():
        print(f"  {signal:22s} {value:.3f}")
    for task, signal in (("contradicting_vs_rest", "contradiction"),
                         ("masked_vs_aligned", "emotional_divergence")):
        print(f"AUROC, {task}: {signal} {a[task][signal]:.3f}"
              f" vs lexical baseline (best direction)"
              f" {a[task]['lexical_baseline_best_direction']:.3f}")
    tw = metrics["three_way"]
    print(f"3-way accuracy (leave-one-out): {tw['accuracy_leave_one_out']:.3f}"
          f"  (majority baseline {tw['majority_baseline']:.3f})")
    print(f"\nWrote {OUT_PATH.relative_to(ROOT.parent)}")


if __name__ == "__main__":
    main()
