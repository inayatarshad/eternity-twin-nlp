# 01 — Information Architecture

> Status: Phase 0 proposal. The repository has **no existing routes or app shell**, so this is a
> greenfield proposal, not a retrofit. Route names assume Next.js App Router (see `08-technical-approach.md`).

## Main screens

| Screen | Purpose | Mode |
|---|---|---|
| **Awakening** (`/`) | First-run cinematic + entry; returning users pass through quickly | Immersive |
| **Brain** (`/brain`) | The 3D brain; top-level navigation and live cognitive status | Immersive |
| **Lobe** (`/brain/[lobe]`) | Spatial knowledge graph scoped to one cognitive function | Immersive |
| **Node** (`/brain/[lobe]/node/[nodeId]`) | Lobe view with a node selected + inspector open | Immersive overlay |
| **Search** (`/search`) | Semantic search across all lobes | Hybrid (overlay over current scene) |
| **Timeline** (`/timeline`) | Chronological traversal of memories/events | Hybrid |
| **Insights** (`/insights`) | Surfaced patterns, contradictions, value conflicts | Hybrid |
| **Settings** (`/settings`) | Motion, performance tier, accessibility, data source | Standard 2D |

## Route proposal

```
/
/brain
/brain/[lobe]                       lobe ∈ frontal | limbic | temporal | parietal | occipital | core
/brain/[lobe]/node/[nodeId]
/search?q=...&types=...
/timeline?from=...&to=...
/insights
/insights/[insightId]
/settings
```

Rules:

- Deep links must work: loading `/brain/limbic/node/mem-042` cold restores camera, lobe scope, and
  the open inspector (with a non-cinematic "already inside" entry).
- Browser Back mirrors spatial "zoom out": node → lobe → brain.
- `[lobe]` slugs are stable IDs, not display names (display names may change; see `02`).

## Screen hierarchy

```
Awakening
└── Brain (hub)
    ├── Lobe ×6
    │   └── Node (inspector overlay, non-modal)
    ├── Search (command-palette overlay, available everywhere)
    ├── Timeline (bottom drawer over Brain or Lobe)
    ├── Insights (side panel or full view)
    └── Settings (standard page)
```

## Brain-level navigation

- **Pointer:** orbit (drag), zoom (wheel/pinch, clamped), hover lobe → label + summary tooltip,
  click lobe → enter.
- **Keyboard:** `Tab`/arrows cycle lobes (focus ring rendered in 3D + announced), `Enter` enters,
  `Esc` releases focus to global nav.
- **Persistent chrome (minimal):** top-left identity mark + persona name; top-right: search trigger
  (`⌘K`/`Ctrl+K`), settings; bottom: contextual hint line ("Select a region to enter").

## Lobe-level navigation

- Pan/zoom/orbit within the node universe; camera constrained to the lobe's volume.
- Hover node → label; focus/click node → inspector (route updates to `/node/[nodeId]`).
- Cluster labels act as landmarks; clicking a cluster label frames the cluster.
- **Return:** breadcrumb "Brain", `Esc`, or zooming out past a threshold triggers exit transition.
- Cross-lobe edges render as portals/filaments exiting the volume; following one triggers a
  lobe-to-lobe transition (through the "white matter", not back out through the brain view).

## Node-level navigation

- Inspector panel (right side, glass surface) shows node details, metadata, and relationship list.
- Selecting a relationship in the inspector traces the edge visually and can hop selection.
- `Esc` or clicking empty space deselects (route returns to `/brain/[lobe]`).

## Global navigation & contextual controls

- **Command palette / search** (`⌘K`): globally available, the primary power-user surface.
- **Breadcrumb** (top-center, fades in after leaving `/brain`):
  `Eternity ▸ Limbic — Emotion ▸ "Betrayal — leaked roadmap"`. Each segment is a link.
- **Contextual controls** appear per mode: filters + timeline scrubber in lobe view; trace/pin
  actions in node inspector; nothing extraneous at brain level.
- **Minimap** (lobe view, bottom-right): miniature brain showing current lobe + camera frustum.

## Search behavior

- Trigger: `⌘K`/`Ctrl+K`, `/` key, or the search icon.
- Input: free text; filters by node type, lobe, emotion, time range.
- Results are grouped by lobe, ranked by semantic relevance; keyboard navigable.
- Selecting a result **travels** to it: closes palette, transitions to the lobe (fast path, ~1.2 s,
  skippable), frames and selects the node. Reduced-motion: instant cut with focus announced.
- Empty query state shows recent nodes and suggested entry points ("Most active this week").

## Breadcrumb behavior

- Hidden on `/` and `/brain` (the brain *is* the root).
- Appears during lobe entry, persists in lobe/node views.
- Truncates node titles > 40 chars with ellipsis + tooltip.
- Fully keyboard operable; acts as the screen-reader landmark for "where am I".

## Back and return flows

| From | Back gesture | Result |
|---|---|---|
| Lobe | browser Back / `Esc` / breadcrumb "Brain" / zoom-out past threshold | Exit transition → `/brain`, camera returns to orbit |
| Node | browser Back / `Esc` / click void | Deselect, inspector closes, stay in lobe |
| Search result (traveled) | browser Back | Return to prior lobe & camera pose |
| Timeline/Insights overlays | `Esc` / close button | Underlying scene unchanged |

Camera poses are stored per visited lobe for the session, so returning feels like *coming back*,
not resetting.

## Empty states

- **Lobe with no nodes:** the volume renders with sparse ambient particles and a centered caption —
  "No memories have formed here yet" (copy per lobe) + hint on how data arrives. Never a blank void.
- **No search results:** "Nothing resonates with ‘X’" + type-filter suggestions + recent nodes.
- **No insights:** explains what insights are and what will generate them.

## Loading states

- **Initial load:** the Awakening doubles as the loading experience — progress is expressed as the
  brain assembling from particles (asset/model loading drives real progress; see `05`). Hard budget:
  interactive < 5 s on mid-tier hardware; a "Skip" affordance appears after 1.5 s.
- **Lobe data fetch:** nodes materialize in staged waves (clusters first, leaves second). A subtle
  progress shimmer on the breadcrumb indicates incompleteness.
- **Inspector fetch:** skeleton lines inside the glass panel, no spinners in the 3D scene.

## Error states

- **Data fetch failure:** non-blocking toast in immersive views ("The twin's memory is unreachable —
  Retry") + cached data if available; full-screen error only if nothing can render.
- **WebGL unavailable / context lost:** automatic fallback to the 2D mode (see `09`), with a notice
  and a "Try 3D again" action. Never a dead page.
- **Bad deep link (unknown lobe/node):** land on `/brain` with toast "That memory could not be found."

## Open IA questions

Tracked in `11-decisions-and-open-questions.md`: whether Timeline/Insights are full routes vs.
overlays only (proposal: routes that render as overlays, so they're linkable), and whether the
persona-editing dashboard from the earlier MVP gets a route here at all.
