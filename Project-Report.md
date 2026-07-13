\# Comprehensive Project Report: Eternity Twin v1.0

\*\*Project:\*\* Value-Driven Digital Twin Architecture (Phase 1 MVP)  

\*\*Engine:\*\* Open-Weights LLM (Qwen2.5-1.5B-Instruct) + RoBERTa Sequence Classification  



\---



\## 1. Project Scope \& Objective

The objective of the Eternity Twin project is to engineer a highly authentic, real-time Digital Twin architecture. Moving beyond standard, statically-guardrailed AI, this system utilizes a \*\*Persona Specification Engine\*\* to mathematically filter generative outputs through defined human psychology vectors. The primary goal is to simulate complex human behaviors, internal monologues, and value-driven decision-making in high-stress scenarios.



\---



\## 2. Phase 1: Emotional Data Pipeline (RoBERTa Baseline)

To ensure the Digital Twin can accurately map and interpret human emotions, a dedicated classification head was trained and evaluated before integrating the generative response engine.



\* \*\*Dataset Identification:\*\* Utilized Google's `GoEmotions` dataset (28 distinct emotional labels + neutral). 

\* \*\*Data Cleaning \& EDA:\*\* Conducted Exploratory Data Analysis (EDA) to map label frequencies. Identified a severe multi-label class imbalance (long-tail distribution). Mitigated this by optimizing the prediction threshold to `0.25` to capture subtle emotional signals.

\* \*\*Training \& Splitting:\*\* The dataset was split into training and validation sets. Executed an accelerated 5-epoch training loop on a T4 GPU utilizing `fp16` precision to evaluate backpropagation and weight alignment.

\* \*\*Telemetry \& Overfitting:\*\* Training telemetry revealed the model optimized at Epoch 1 (Validation Loss: 0.092) before overfitting (Epoch 5 Validation Loss: 0.105). An early-stopping strategy was implemented using the Epoch 1 checkpoint for maximum generalization.

\* \*\*Validation Metrics:\*\*

&#x20;   \* \*\*Micro F1-Score:\*\* `49.41%` (Successfully outperforming the original Google Research baseline of 46%).

&#x20;   \* \*\*Strict Exact-Match Accuracy:\*\* `51.00%`.

&#x20;   \* \*\*Per-Label Precision (Key Vectors):\*\* Amusement (`80.00%`), Admiration (`71.79%`).



\---



\## 3. Phase 2: Persona Specification Schema

The core of the Digital Twin relies on mathematical behavioral mapping rather than generic prompting. The persona is quantified using the following structured parameters:



1\.  \*\*Big 5 Personality Traits:\*\* Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism (Scaled 1-100).

2\.  \*\*Core Values:\*\* Quantifiable moral anchors (e.g., Honesty: 90, Ambition: 70, Loyalty: 85).

3\.  \*\*Emotional Baseline:\*\* The default resting psychological state of the twin.

4\.  \*\*Backstory / Context:\*\* Critical environmental and historical memory anchors.



\*\*Emotion Interpretation \& Valuation:\*\* Emotions and values are mapped numerically. The generative engine interprets these numerical weights dynamically. For instance, a high `Ambition` value (>75) combined with a threat scenario mathematically suppresses the `Empathy` vector, altering the resulting inner monologue.



\---



\## 4. Phase 3: Response Engine Architecture

The generative backend is decoupled from the frontend to allow for heavy GPU inference.



\* \*\*The Engine:\*\* `Qwen2.5-1.5B-Instruct` (Open-weights), loaded in 4-bit quantization on a T4 Tensor Core GPU.

\* \*\*Infrastructure:\*\* Deployed via a FastAPI backend and tunneled securely to the internet using Cloudflare (bypassing restrictive CORS and local ISP preflight blocks).

\* \*\*Schema Enforcement:\*\* The model is strictly constrained to output a standardized JSON format for programmatic parsing:

&#x20;   ```json

&#x20;   {

&#x20;       "dominant\_internal\_emotion": "string",

&#x20;       "triggered\_core\_value": "string",

&#x20;       "inner\_monologue": "string",

&#x20;       "verbal\_response": "string"

&#x20;   }

&#x20;   ```



\---



\## 5. Phase 4: Minimum Viable Product (UI)

To visually validate the structured responses, a production-grade web dashboard was developed.

\* \*\*Tech Stack:\*\* Next.js, Tailwind CSS, Vercel.

\* \*\*Features:\*\* \* Real-time slider telemetry for dynamic Persona parameter adjustments (Big 5 \& Values).

&#x20;   \* A simulated "Neural Core" status UI.

&#x20;   \* A live JSON terminal that parses and displays the decoupled emotional state versus the external verbal response.



\---



\## 6. Phase 5: Validation \& Testing Strategy

Validation is conducted through a matrix of predefined, high-stress contextual questions (e.g., \*Corporate Espionage / Leaked Roadmap\*).



\* \*\*Synthetic Validation (Current):\*\* Ablation testing of the persona traits. (e.g., Running the exact same scenario with `Ambition = 90` vs. `Empathy = 100` and validating the JSON structural integrity and behavioral delta).

\* \*\*Human Ground-Truth Validation (Next Steps):\*\* Collecting real-world response data from a volunteer control group to execute comparative persona delta testing against the Digital Twin's outputs.



\---



\## 7. Current Limitations \& Future Work

\* \*\*Inference vs. Fine-Tuning:\*\* The current MVP relies heavily on Zero-Shot and Few-Shot prompting schemas for the generative engine. 

\* \*\*Next Phase:\*\* Utilize the volunteer human ground-truth data currently being collected to execute formal LoRA (Low-Rank Adaptation) fine-tuning on the T4 GPU, transitioning the system from behavioral \*simulation\* to native behavioral \*emulation\*.

\* \*\*Subjectivity of Emotional Data:\*\* The baseline emotional classification currently inherits the standard inter-rater reliability issues present in all subjective humanly-annotated datasets like GoEmotions.

