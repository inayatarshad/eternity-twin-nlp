# 03 — User Flows

> Status: Phase 0 proposal. Each flow lists: entry point, intention, interaction sequence, visual
> response, system response, exit, errors, accessibility. Durations are targets, not commitments,
> and every cinematic beat is skippable (click/`Esc`/keypress) and replaced under reduced motion.

## 1. Initial awakening

- **Entry:** first visit to `/`.
- **Intention:** understand what this is; reach the brain.
- **Sequence:** dark field with ambient particles → particles drift inward and condense into the
  brain silhouette (mirrors the reference video's warp-dive in reverse) → light source blooms behind
  it → title + persona name fade in → "Enter" (button + `Enter` key).
- **Visual response:** progressive assembly doubles as the real asset-loading indicator.
- **System response:** preloads brain model, shaders, lobe metadata; routes to `/brain` on Enter.
- **Exit:** `/brain`. Returning visitors (localStorage flag) get a 1 s condensed version.
- **Errors:** asset failure → skip to 2D fallback home with message.
- **A11y:** `prefers-reduced-motion` → static brain image + fade; screen reader announces
  "Eternity Twin. A cognitive interface. Press Enter to explore the brain." Focus starts on Enter.

## 2. Exploring the brain

- **Entry:** `/brain`.
- **Intention:** orient; see the mind's overall state.
- **Sequence:** brain idles (breathing, ambient synaptic pulses); user orbits (drag) and zooms
  (wheel, clamped); lobes with higher live activity glow marginally brighter.
- **System response:** nothing loads eagerly except lobe summaries.
- **Exit:** hover/select a lobe; open search; leave for timeline/insights/settings.
- **Errors:** WebGL context lost → 2D lobe-map fallback (see `09`).
- **A11y:** the brain is a labeled `listbox`-like widget: `Tab` into it, arrows cycle lobes,
  each announcing name + one-line summary + activity level.

## 3. Hovering a lobe

- **Entry:** pointer over a lobe (or keyboard focus).
- **Sequence:** ≤100 ms: lobe material brightens, edge refraction intensifies, `LobeLabel` +
  one-line summary and stats (node count, last activity) fade in near the lobe; other lobes dim
  slightly (attention vignette). Synaptic pulses within the lobe accelerate subtly.
- **Exit:** pointer leaves → 250 ms decay back to idle.
- **A11y:** identical treatment on keyboard focus; tooltip content mirrored to `aria-describedby`.

## 4. Selecting / entering a lobe

- **Entry:** click / `Enter` on a hovered or focused lobe.
- **Intention:** dive into that cognitive region.
- **Sequence:** click → activation pulse radiates through the lobe (~200 ms acknowledgment) → camera
  accelerates toward and *through* the cortex → brief particle warp (the video reference beat,
  600–900 ms) → decelerates inside the node universe; clusters resolve from bokeh to sharp.
  Breadcrumb fades in. Route becomes `/brain/[lobe]` (pushed at gesture time, not animation end).
- **System response:** lobe graph data fetched at pulse time; warp masks latency up to ~800 ms.
- **Exit:** user is in Flow 5.
- **Errors:** fetch fails mid-warp → arrive in empty volume with retry toast (never stuck in warp).
- **A11y:** reduced motion → 300 ms crossfade; announce "Entered Limbic — Emotion. 48 nodes,
  6 clusters." Focus moves to graph container.

## 5. Exploring the node universe

- **Entry:** arrival inside a lobe.
- **Intention:** survey; find something interesting.
- **Sequence:** pan/orbit/zoom; cluster labels act as landmarks; nodes brighten slightly as camera
  nears (proximity = ambient activation). Filter bar and timeline scrubber available.
- **System response:** off-frustum nodes LOD-degrade to points (see `09` limits).
- **Exit:** select a node (6); trace an edge (7); exit lobe (10); cross-lobe portal.
- **A11y:** spatial graph mirrored as a navigable list ("Explore as list" — always visible), grouped
  by cluster; arrow keys walk nodes in spatial-neighbor order; every camera move announceable.

## 6. Selecting a node

- **Entry:** click/`Enter` on a node.
- **Sequence:** node → `focused` (bloom ring, slight scale); camera eases to frame it (500 ms);
  direct relationships illuminate; unrelated nodes dim to 30%; `NodeInspector` slides in
  (glass panel, right): title, type badge, lobe, summary, scalar meters (intensity/confidence/
  relevance/recency), relationship list, provenance (e.g. source exchange for reasoning nodes).
- **System response:** route → `/brain/[lobe]/node/[id]`; neighbor detail prefetched.
- **Exit:** `Esc`/void-click deselects; selecting a relationship hops (7).
- **Errors:** node detail fetch fails → inspector shows cached label + retry.
- **A11y:** inspector is a complementary landmark, focus moves into it, `Esc` returns focus to node;
  meters are real `<meter>`/text, not just bars.

## 7. Tracing relationships

- **Entry:** relationship row in inspector, or hovering an edge in-scene.
- **Intention:** follow the "why" chain.
- **Sequence:** hover row → edge ignites with a directional light pulse (source → target, ~400 ms);
  click → selection hops to target node (Flow 6, camera glide ≤800 ms). If target is in another
  lobe: short white-matter transit (interstitial tunnel, ~1 s) instead of exiting to brain view.
  A **pathway history** ribbon records the hop chain (backtrackable).
- **A11y:** rows read "contradicts → ‘Verbal response, roadmap scenario’, strength 0.8, in Frontal —
  Reasoning"; hops announce arrival context; reduced motion cuts instead of gliding.

## 8. Searching memories

- **Entry:** `⌘K` / `Ctrl+K` / `/` / search icon — anywhere.
- **Sequence:** command palette (glass, centered) → type-ahead grouped results (lobe-grouped, type
  icons, relevance order) → arrows + `Enter` → palette closes → travel to node (fast-path transition,
  ~1.2 s, skippable) → node focused (Flow 6).
- **System response:** semantic search endpoint (or client-side mock in early phases); recent-nodes
  suggestions on empty query.
- **Errors:** search backend down → fall back to client-side fuzzy match over loaded nodes, labeled
  "offline results".
- **A11y:** standard combobox semantics; result count announced; full keyboard flow — this palette is
  the primary non-pointer navigation instrument for the whole app.

## 9. Filtering data

- **Entry:** filter bar in lobe view (types, emotion family, time range, min-strength).
- **Sequence:** toggling a filter → excluded nodes exhale to faint embers (250 ms), not removed —
  structure stays legible; active-filter chips shown; "Clear" restores.
- **System response:** filter state in URL query (shareable).
- **A11y:** chips are toggle buttons with state; result count change announced ("12 of 48 visible").

## 10. Returning to the brain

- **Entry:** breadcrumb "Brain", `Esc` from unfocused lobe view, or zoom-out past threshold.
- **Sequence:** camera pulls back through cortex (reverse warp, ~700 ms); lobe re-seals with a soft
  glow; brain view restores previous orbit pose. Route → `/brain`.
- **A11y:** reduced motion → crossfade; announce "Returned to brain overview."

## 11. Following an insight

- **Entry:** `/insights` panel — cards like "Ambition suppressed Empathy in 3 of 4 threat scenarios"
  (per the report's ablation framing).
- **Sequence:** card lists derived-from nodes → "Trace" → travels to the primary lobe, dims all but
  the involved subgraph, then plays the connection chain as sequential edge pulses (a guided tour;
  `Space` pauses, arrows step).
- **Exit:** any node in the chain selectable; `Esc` restores normal lobe view.
- **A11y:** the tour has a text transcript in a side panel, steps announced; fully keyboard-steppable.

## 12. Viewing emotional relationships

- **Entry:** Limbic lobe, or an `emotion` node from anywhere.
- **Sequence:** Limbic arranges emotion nodes by family (five constellations + neutral); selecting an
  emotion illuminates every `felt_during`/`triggered` edge to memories, events, and stimuli —
  spectral diffusion (prism reference) spreads the emotion's hue along the edges. Intensity histogram
  in inspector shows distribution over time.
- **A11y:** hue never sole encoding — family also given by label + cluster position (see `09`).

## 13. Navigating through time

- **Entry:** `/timeline` or the scrubber in lobe view.
- **Sequence:** bottom drawer: horizontal time band with event/memory density; dragging the playhead
  re-weights `recency` live — nodes outside the window fade to embers, nodes inside brighten;
  "play" animates a period (formation order becomes visible).
- **System response:** window state in URL; timeline works per-lobe and globally.
- **Errors:** undated nodes collect in an "undated" tray, never silently hidden.
- **A11y:** scrubber is a slider with date announcements; play/pause is a real button; reduced motion
  jumps between window states without tweening.
