# Better Project — Build Reference

_Full chat summary for continuing development. Clear the conversation and reference this file._

---

## What Was Built

**Better Project** is an AI-powered project charter builder. Four phases, built from scratch.

- **Live URL:** https://better-project-app.netlify.app
- **GitHub:** https://github.com/alqasim91/better-project
- **Tech stack:** React 18, TypeScript, Tailwind CSS, Zustand, Zod, Vite, Netlify Functions, Kimi 2 (moonshot.ai), jsPDF, vis-timeline, d3-force

---

## Phase 1 — Foundation & Core Form Engine ✅

### Files created
```
src/types/charter.ts              # Central Charter model (7 sections), MinimalInputs
src/lib/validationSchemas.ts      # Zod schemas mirroring the charter model
src/lib/utils.ts                  # cn() utility
src/lib/templateRegistry.ts       # Smart Template registry
src/data/industryTemplates.ts     # 4 industry templates + blank
src/stores/charterStore.ts        # Zustand store (template seeding, section updates)
src/hooks/useWizard.ts            # Step navigation, progress %
src/hooks/useFormPersistence.ts   # Debounced localStorage autosave + hydration
src/components/templates/TemplateSelector.tsx
src/components/wizard/WizardContainer.tsx
src/components/wizard/StepNavigation.tsx
src/components/forms/ProjectBasicsForm.tsx
src/components/forms/GoalsObjectivesForm.tsx
src/components/forms/StakeholdersForm.tsx
src/components/forms/ScopeConstraintsForm.tsx
src/components/forms/RiskAssumptionsForm.tsx
src/components/forms/DeliverablesForm.tsx
src/components/forms/TimelineBudgetForm.tsx
src/components/forms/fields/ListField.tsx
src/components/ui/button.tsx      # Hand-rolled shadcn/ui primitives (no Radix)
src/components/ui/input.tsx
src/components/ui/textarea.tsx
src/components/ui/label.tsx
src/components/ui/card.tsx
src/components/ui/badge.tsx
src/components/ui/dialog.tsx      # Custom portal modal (no Radix)
```

### Key decisions
- Forms are **store-bound (controlled)**, not RHF — simpler for the 7 wizard steps
- shadcn/ui primitives are **hand-rolled** (no shadcn CLI, no Radix dependency)
- Lucide icons must be **imported by name** — `import * as Icons` balloons bundle to ~1MB
- localStorage persistence key: `better-project:charter`

---

## Phase 2 — AI Auto-Generator & Validation Engine ✅

### Files created
```
src/types/ai.ts                         # GeneratedSection, ConfidenceScore, confidenceBand()
src/lib/aiResponseParser.ts             # parseStructuredResponse<T>, AiParseError
src/lib/apiClient.ts                    # callFunction() → fetch /.netlify/functions/<name>
src/lib/applyGenerated.ts              # Merges AI output into charter store (coerces types, mints ids)
src/lib/completeness.ts                # computeCompleteness() — 18 checks, critical vs non-critical
src/services/ai/promptBuilders.ts      # buildGenerationPrompt(), buildConfidenceScoringPrompt()
src/services/ai/charterGenerator.ts    # generateCharterDraft() — calls generate-charter function
src/services/ai/confidenceScorer.ts    # scoreConfidence() — calls score-confidence function
src/hooks/useAIGeneration.ts           # useCharterGeneration(), useConfidenceScoring()
src/hooks/useValidation.ts             # useCompletenessValidation() — debounced, 250ms
src/components/ai/AutoGenerateModal.tsx
src/components/ai/ConfidenceIndicators.tsx   # green ≥80, amber 50-79, red <50
src/components/ai/ReviewSuggestions.tsx      # accept / reject / modify per section
src/components/validation/CompletenessChecker.tsx   # SVG progress ring
src/components/validation/SectionStatusBar.tsx      # Sticky header, jump-to chips
src/components/validation/MissingFieldsAlert.tsx    # Dismissible critical-fields banner
netlify/functions/generate-charter.mts
netlify/functions/score-confidence.mts
netlify/functions/_shared/openai.mts   # Kimi 2 via moonshot.ai API
netlify/functions/_shared/prompts.mts  # Self-contained prompt builders for Deno/Node
```

### AI backend — Netlify Functions + Kimi 2
- **No Supabase** — dropped entirely in favour of Netlify Functions
- API endpoint: `https://api.moonshot.ai/v1/chat/completions`
- Default model: `kimi-k2-0711-chat`
- Client calls: `/.netlify/functions/generate-charter` and `/.netlify/functions/score-confidence`
- **Env var to set in Netlify:** `MOONSHOT_API_KEY=sk-...` (server-side only, never VITE_-prefixed)
- Optional: `AI_MODEL=kimi-k2-0711-chat` to override model
- **Local dev with functions:** `npx netlify dev` (plain `npm run dev` doesn't serve functions)
- Streaming upgrade planned later (same pattern as Alex.Co AI Solutions)

### Completeness gate
- Min 60% completeness to advance wizard steps (`MIN_COMPLETENESS_TO_PROCEED = 60`)
- Critical fields (block export): project name, summary, vision, 1 objective, 1 stakeholder, 1 in-scope item, 1 deliverable, 1 milestone

---

## Phase 3 — Timeline Dashboard & Stakeholder Mapper ✅

### Files created
```
src/types/timeline.ts
src/types/stakeholder.ts
src/lib/stakeholderLayout.ts     # calculateQuadrantPositions(), calculateForceLayout() (d3-force)
src/lib/timelineExporter.ts      # exportTimelineToHTML() — standalone HTML with vis-timeline CDN
src/hooks/useTimeline.ts         # vis-data DataSet + charter store sync
src/hooks/useStakeholderMap.ts   # nodes/edges, quadrant + force positions
src/components/timeline/TimelineDashboard.tsx   # vis-timeline widget, zoom, export
src/components/timeline/TimelineEditor.tsx      # Milestone CRUD modal
src/components/timeline/MilestoneMarker.tsx     # Type icon + status badge card
src/components/timeline/DependencyLines.tsx     # SVG dependency arrows
src/components/stakeholders/StakeholderMapper.tsx    # Matrix / Network toggle
src/components/stakeholders/InfluenceMatrix.tsx      # 2x2 Power/Interest grid
src/components/stakeholders/RelationshipGraph.tsx    # SVG force-directed graph + edge builder
src/components/stakeholders/StakeholderCard.tsx
src/components/dashboard/DashboardView.tsx
```

### App navigation (added)
Header tabs: **Editor** | **Dashboard** | **Export**

---

## Phase 4 — Export System & Polish ✅

### Files created
```
src/lib/exportUtils.ts                       # sanitizeFilename(), downloadBlob(), formatters
src/services/export/pdfStyles.ts             # PDF color + typography constants
src/services/export/pdfGenerator.ts          # generatePDF() — jsPDF data-driven A4, no DOM capture
src/services/export/htmlGenerator.ts         # generateHTML() — standalone HTML + vis-timeline CDN
src/hooks/useExport.ts                       # exportPDF(), exportHTML() — lazy-loaded
src/components/export/ExportModal.tsx        # PDF / HTML tab dialog
src/components/export/ExportOptions.tsx      # Include timeline / stakeholder / budget checkboxes
src/components/charter/CharterPreview.tsx    # Read-only summary, all sections
src/components/charter/FinalReview.tsx       # Pre-export: completeness + gated export button
src/components/ui/LoadingStates.tsx          # SkeletonExport, GeneratingOverlay, ProgressBar
src/components/ui/EmptyStates.tsx            # NoDataForExport, ExportError
```

### Code splitting
jsPDF and htmlGenerator are **lazy-loaded via dynamic `import()`** so they don't bloat the initial bundle:
- Main chunk: ~751KB gzipped ~212KB
- pdfGenerator chunk: ~395KB (only loads on export click)
- htmlGenerator chunk: ~6KB

---

## Deployment

### GitHub
- Repo: `https://github.com/alqasim91/better-project`
- Branch: `main`
- Force-pushed to replace old content

### Netlify
- Site: `better-project-app.netlify.app`
- Site ID: `33a69cd7-898b-45b3-8844-dc2ce8a56e11`
- Build command: `npm run build`
- Publish dir: `dist`
- Functions dir: `netlify/functions`
- Auto-deploys on push to `main`

### ⚠️ Still to do — add API key in Netlify
**Netlify → better-project-app → Site settings → Environment variables**
```
MOONSHOT_API_KEY = sk-...
```

---

## Conventions & Gotchas

| Convention | Detail |
|------------|--------|
| Lucide imports | Always named imports — never `import * as Icons` |
| shadcn/ui | Hand-rolled, no Radix, no shadcn CLI |
| Netlify functions | `.mts` files in `netlify/functions/`, excluded from `tsconfig.json` via `"exclude": ["netlify"]` |
| Forms | Store-bound controlled inputs (not RHF) for the 7 wizard steps |
| Edge function prompts | Self-contained copies in `netlify/functions/_shared/prompts.mts` — can't import `@/` alias |
| CSS theme vars | Defined in `src/index.css` — shadcn slate/indigo HSL variables |
| Charter persistence | `localStorage` key: `better-project:charter`, debounced 600ms |
| Streaming (future) | Convert Netlify functions to streaming response — same pattern as Alex.Co AI Solutions |

---

## Git History

```
127ff91  Phase 4: Export system, final review, and polish
0680e08  Phase 3: Timeline dashboard & stakeholder mapper
2db1a14  Phase 1 & 2: Foundation, AI generation, validation engine
```

---

## File Tree (src/)

```
src/
├── App.tsx
├── main.tsx
├── index.css
├── vite-env.d.ts
├── types/
│   ├── charter.ts
│   ├── ai.ts
│   ├── timeline.ts
│   └── stakeholder.ts
├── stores/
│   └── charterStore.ts
├── hooks/
│   ├── useWizard.ts
│   ├── useFormPersistence.ts
│   ├── useAIGeneration.ts
│   ├── useValidation.ts
│   ├── useTimeline.ts
│   ├── useStakeholderMap.ts
│   └── useExport.ts
├── lib/
│   ├── utils.ts
│   ├── validationSchemas.ts
│   ├── templateRegistry.ts
│   ├── aiResponseParser.ts
│   ├── apiClient.ts
│   ├── applyGenerated.ts
│   ├── completeness.ts
│   ├── stakeholderLayout.ts
│   ├── timelineExporter.ts
│   └── exportUtils.ts
├── data/
│   └── industryTemplates.ts
├── services/
│   ├── ai/
│   │   ├── promptBuilders.ts
│   │   ├── charterGenerator.ts
│   │   └── confidenceScorer.ts
│   └── export/
│       ├── pdfStyles.ts
│       ├── pdfGenerator.ts
│       └── htmlGenerator.ts
└── components/
    ├── ui/
    │   ├── button.tsx
    │   ├── input.tsx
    │   ├── textarea.tsx
    │   ├── label.tsx
    │   ├── card.tsx
    │   ├── badge.tsx
    │   ├── dialog.tsx
    │   ├── LoadingStates.tsx
    │   └── EmptyStates.tsx
    ├── templates/
    │   └── TemplateSelector.tsx
    ├── wizard/
    │   ├── WizardContainer.tsx
    │   └── StepNavigation.tsx
    ├── forms/
    │   ├── ProjectBasicsForm.tsx
    │   ├── GoalsObjectivesForm.tsx
    │   ├── StakeholdersForm.tsx
    │   ├── ScopeConstraintsForm.tsx
    │   ├── RiskAssumptionsForm.tsx
    │   ├── DeliverablesForm.tsx
    │   ├── TimelineBudgetForm.tsx
    │   └── fields/ListField.tsx
    ├── ai/
    │   ├── AutoGenerateModal.tsx
    │   ├── ConfidenceIndicators.tsx
    │   └── ReviewSuggestions.tsx
    ├── validation/
    │   ├── CompletenessChecker.tsx
    │   ├── SectionStatusBar.tsx
    │   └── MissingFieldsAlert.tsx
    ├── timeline/
    │   ├── TimelineDashboard.tsx
    │   ├── TimelineEditor.tsx
    │   ├── MilestoneMarker.tsx
    │   └── DependencyLines.tsx
    ├── stakeholders/
    │   ├── StakeholderMapper.tsx
    │   ├── InfluenceMatrix.tsx
    │   ├── RelationshipGraph.tsx
    │   └── StakeholderCard.tsx
    ├── charter/
    │   ├── CharterPreview.tsx
    │   └── FinalReview.tsx
    ├── export/
    │   ├── ExportModal.tsx
    │   └── ExportOptions.tsx
    └── dashboard/
        └── DashboardView.tsx

netlify/
└── functions/
    ├── _shared/
    │   ├── openai.mts    # Kimi 2 API client
    │   └── prompts.mts   # Prompt builders
    ├── generate-charter.mts
    └── score-confidence.mts
```
