# Project: Better Project
## Generated for: Claude

---

## Phase 1: Foundation & Core Form Engine
**Focus:** Build the structured data collection system with Smart Templates and Guided Wizard, establishing the form architecture that feeds all downstream features



---

## Phase 2: AI Auto-Generator & Validation Engine
**Focus:** Implement hybrid AI generation with confidence scoring, plus real-time validation checking for charter completeness

You are a Full-Stack Product Engineer continuing to build Better Project. Tech stack: React 18, TypeScript, Tailwind CSS, shadcn/ui, Zustand (state), React Hook Form + Zod (validation), OpenAI GPT-4 API, html2canvas + jsPDF (PDF export), vis-timeline (timeline viz), Vite, Supabase (storage/edge functions), Vercel (deploy).
Already built in prior phases:
Phase 1 (Foundation & Core Form Engine): src/components/templates/TemplateSelector.tsx,src/components/wizard/WizardContainer.tsx,src/components/wizard/StepNavigation.tsx,src/components/forms/ProjectBasicsForm.tsx,src/components/forms/GoalsObjectivesForm.tsx,src/components/forms/StakeholdersForm.tsx,src/components/forms/ScopeConstraintsForm.tsx,src/components/forms/RiskAssumptionsForm.tsx,src/components/forms/DeliverablesForm.tsx,src/components/forms/TimelineBudgetForm.tsx,src/hooks/useWizard.ts,src/hooks/useFormPersistence.ts,src/lib/templateRegistry.ts,src/lib/validationSchemas.ts,src/stores/charterStore.ts,src/types/charter.ts,src/data/industryTemplates.ts

Create src/services/ai/promptBuilders.ts with buildGenerationPrompt(minimalInputs, templateContext) and buildConfidenceScoringPrompt(generatedSection, sourceInputs) functions that construct GPT-4 prompts with explicit JSON output schemas.

Create src/services/ai/charterGenerator.ts with generateCharterDraft(inputs: MinimalInputs): Promise<GeneratedSection[]> that calls OpenAI with streaming response handling and structured output parsing.

Create src/services/ai/confidenceScorer.ts with scoreConfidence(generated: GeneratedSection, sources: MinimalInputs): Promise<ConfidenceScore> using GPT-4 to evaluate extrapolation certainty on 0-100 scale with reasoning.

Create src/lib/aiResponseParser.ts with parseStructuredResponse<T>(raw: string, schema: ZodSchema): T for safe JSON extraction from AI responses with fallback error handling.

Create src/edge-functions/generate-charter/index.ts as Supabase Edge Function that receives {inputs, templateId}, calls GPT-4 with 30s timeout, returns {sections: GeneratedSection[], metadata: {model, tokensUsed}}.

Create src/edge-functions/score-confidence/index.ts as Supabase Edge Function that receives {generatedSection, sourceInputs}, returns {score: number, reasoning: string, flags: string[]}.

Create src/hooks/useAIGeneration.ts with useCharterGeneration() returning {generate, isGenerating, progress, sections, error} and useConfidenceScoring() returning {scoreSection, scores, isScoring}.

Create src/components/ai/AutoGenerateModal.tsx with shadcn Dialog, input fields for project name + goals + stakeholders, generate button with progress steps, and preview of generated sections.

Create src/components/ai/ConfidenceIndicators.tsx displaying score badges (green ≥80, yellow 50-79, red <50) with tooltip explanations per section.

Create src/components/ai/ReviewSuggestions.tsx listing low-confidence extrapolations with inline edit suggestions and "accept/reject/modify" actions.

Create src/hooks/useValidation.ts with useCompletenessValidation() returning {checkCompleteness, missingFields, completenessPercent, isValid} and real-time debounced validation.

Create src/components/validation/CompletenessChecker.tsx with circular progress indicator and section-by-section breakdown.

Create src/components/validation/SectionStatusBar.tsx as sticky header showing overall completeness and quick-jump to incomplete sections.

Create src/components/validation/MissingFieldsAlert.tsx with dismissible banner listing critical missing fields blocking PDF/HTML export.

Install @supabase/supabase-js for edge function client calls. Add OPENAI_API_KEY to Supabase secrets. Configure edge functions with deno.json imports for zod. Wire useAIGeneration into WizardContainer for "Auto-Generate" button on step 2+. Wire validation hooks into StepNavigation to block progression below 60% completeness.

Implements hybrid AI generation with confidence scoring and real-time validation for charter completeness.

---

## Phase 3: Timeline Dashboard & Stakeholder Mapper
**Focus:** Create interactive HTML-exportable timeline visualization and visual stakeholder mapping tool

You are a Full-Stack Product Engineer continuing to build Better Project. Tech stack: React 18, TypeScript, Tailwind CSS, shadcn/ui, Zustand (state), React Hook Form + Zod (validation), OpenAI GPT-4 API, html2canvas + jsPDF (PDF export), vis-timeline (timeline viz), Vite, Supabase (storage/edge functions), Vercel (deploy).

Already built in prior phases:
Phase 1 (Foundation & Core Form Engine): src/components/templates/TemplateSelector.tsx,src/components/wizard/WizardContainer.tsx,src/components/wizard/StepNavigation.tsx,src/components/forms/ProjectBasicsForm.tsx,src/components/forms/GoalsObjectivesForm.tsx,src/components/forms/StakeholdersForm.tsx,src/components/forms/ScopeConstraintsForm.tsx,src/components/forms/RiskAssumptionsForm.tsx,src/components/forms/DeliverablesForm.tsx,src/components/forms/TimelineBudgetForm.tsx,src/hooks/useWizard.ts,src/hooks/useFormPersistence.ts,src/lib/templateRegistry.ts,src/lib/validationSchemas.ts,src/stores/charterStore.ts,src/types/charter.ts,src/data/industryTemplates.ts
Phase 2 (AI Auto-Generator & Validation Engine): src/services/ai/charterGenerator.ts,src/services/ai/confidenceScorer.ts,src/services/ai/promptBuilders.ts,src/components/ai/AutoGenerateModal.tsx,src/components/ai/ConfidenceIndicators.tsx,src/components/ai/ReviewSuggestions.tsx,src/components/validation/CompletenessChecker.tsx,src/components/validation/SectionStatusBar.tsx,src/components/validation/MissingFieldsAlert.tsx,src/hooks/useAIGeneration.ts,src/hooks/useValidation.ts,src/lib/aiResponseParser.ts,src/edge-functions/generate-charter/index.ts,src/edge-functions/score-confidence/index.ts

Install vis-timeline and vis-data: npm install vis-timeline vis-data @types/vis.

Create src/types/timeline.ts: define interfaces Milestone {id, title, date, type: 'milestone'|'deliverable'|'review', dependencies: string[], status, owner}, TimelineData {milestones, startDate, endDate, zoomLevel}, and export type TimelineView = 'linear'|'compact'|'gantt'.

Create src/types/stakeholder.ts: define interfaces StakeholderNode {id, name, role, influence: 1-5, interest: 1-5, category: 'internal'|'external'|'regulatory', x?, y?}, StakeholderEdge {source, target, relationship: 'reports'|'collaborates'|'influences'}, and StakeholderMap {nodes, edges, layoutVersion}.

Create src/hooks/useTimeline.ts: initialize vis-timeline DataSet, expose methods addMilestone, updateMilestone, removeMilestone, setWindow, exportToJSON, subscribe to charterStore.timeline for sync, return {timelineRef, items, groups, actions}.

Create src/hooks/useStakeholderMap.ts: manage force-directed layout simulation using d3-force (install: npm install d3-force @types/d3-force), expose methods addNode, updateNode, removeNode, addEdge, autoLayout, exportPositions, return {nodes, edges, simulation, actions}.

Create src/lib/timelineExporter.ts: function exportTimelineToHTML(timelineData, charterData) that generates standalone HTML with embedded vis-timeline CSS/JS from CDN, inline milestone data, and print-friendly CSS media queries.

Create src/lib/stakeholderLayout.ts: function calculateQuadrantPositions(nodes) for power/interest matrix layout, function calculateForceLayout(nodes, edges, width, height) for relationship graph, return {x, y, quadrant?} for each node.

Create src/components/timeline/TimelineDashboard.tsx: mount vis-timeline in useEffect, bind to useTimeline hook, render zoom controls, view toggle (linear/compact), and "Export HTML" button calling timelineExporter.

Create src/components/timeline/TimelineEditor.tsx: modal form for milestone CRUD using React Hook Form + Zod, dependency selector using current milestones, date pickers with shadcn/ui Calendar.

Create src/components/timeline/MilestoneMarker.tsx: custom vis-timeline item template rendering milestone type icons and status badges with Tailwind classes.

Create src/components/timeline/DependencyLines.tsx: SVG overlay component drawing dependency arrows between milestone DOM elements, recalculate on timeline scroll/zoom.

Create src/components/stakeholders/StakeholderMapper.tsx: main container with toggle between "Matrix View" and "Network View", render InfluenceMatrix or RelationshipGraph based on state, toolbar for add/edit/export.

Create src/components/stakeholders/InfluenceMatrix.tsx: 2x2 grid (Keep Satisfied, Manage Closely, Monitor, Keep Informed), draggable StakeholderCard placement, drop zones update influence/interest scores, grid

---

## Phase 4: Export System & Polish
**Focus:** Build PDF charter export and interactive HTML timeline export, plus final UX refinement

You are a Full-Stack Product Engineer continuing to build Better Project. Tech stack: React 18, TypeScript, Tailwind CSS, shadcn/ui, Zustand (state), React Hook Form + Zod (validation), OpenAI GPT-4 API, html2canvas + jsPDF (PDF export), vis-timeline (timeline viz), Vite, Supabase (storage/edge functions), Vercel (deploy).

Already built in prior phases:
Phase 1 (Foundation & Core Form Engine): src/components/templates/TemplateSelector.tsx,src/components/wizard/WizardContainer.tsx,src/components/wizard/StepNavigation.tsx,src/components/forms/ProjectBasicsForm.tsx,src/components/forms/GoalsObjectivesForm.tsx,src/components/forms/StakeholdersForm.tsx,src/components/forms/ScopeConstraintsForm.tsx,src/components/forms/RiskAssumptionsForm.tsx,src/components/forms/DeliverablesForm.tsx,src/components/forms/TimelineBudgetForm.tsx,src/hooks/useWizard.ts,src/hooks/useFormPersistence.ts,src/lib/templateRegistry.ts,src/lib/validationSchemas.ts,src/stores/charterStore.ts,src/types/charter.ts,src/data/industryTemplates.ts
Phase 2 (AI Auto-Generator & Validation Engine): src/services/ai/charterGenerator.ts,src/services/ai/confidenceScorer.ts,src/services/ai/promptBuilders.ts,src/components/ai/AutoGenerateModal.tsx,src/components/ai/ConfidenceIndicators.tsx,src/components/ai/ReviewSuggestions.tsx,src/components/validation/CompletenessChecker.tsx,src/components/validation/SectionStatusBar.tsx,src/components/validation/MissingFieldsAlert.tsx,src/hooks/useAIGeneration.ts,src/hooks/useValidation.ts,src/lib/aiResponseParser.ts,src/edge-functions/generate-charter/index.ts,src/edge-functions/score-confidence/index.ts
Phase 3 (Timeline Dashboard & Stakeholder Mapper): src/components/timeline/TimelineDashboard.tsx,src/components/timeline/TimelineEditor.tsx,src/components/timeline/MilestoneMarker.tsx,src/components/timeline/DependencyLines.tsx,src/components/stakeholders/StakeholderMapper.tsx,src/components/stakeholders/InfluenceMatrix.tsx,src/components/stakeholders/StakeholderCard.tsx,src/components/stakeholders/RelationshipGraph.tsx,src/hooks/useTimeline.ts,src/hooks/useStakeholderMap.ts,src/lib/timelineExporter.ts,src/lib/stakeholderLayout.ts,src/types/timeline.ts,src/types/stakeholder.ts

Install jsPDF and html2canvas: `npm install jspdf html2canvas`. Create src/services/export/pdfGenerator.ts with `generatePDF(charter: Charter): Promise<Blob>` that uses html2canvas to capture a hidden DOM element and jsPDF to create print-ready A4 pages with header/footer. Create src/templates/pdf/CharterTemplate.tsx as a React component rendering the full charter with Tailwind print classes, sections for project basics, goals, stakeholders (table), scope, risks, deliverables, timeline summary, and budget—ensure `id="pdf-capture-root"` for targeting. Create src/services/export/pdfStyles.ts with color constants matching shadcn slate/indigo theme and typography scales for PDF consistency. Create src/services/export/htmlGenerator.ts with `generateHTML(charter: Charter, timeline: Timeline, stakeholders: Stakeholder[]): string` that returns a complete HTML document string with embedded vis-timeline, inline CSS, and interactive milestone tooltips—use `URL.createObjectURL` for download. Create src/templates/html/TimelineTemplate.tsx as the visual structure for HTML export with timeline container div and stakeholder matrix section. Create src/components/export/ExportModal.tsx with shadcn Dialog, tabs for "PDF Document" and "Interactive HTML", and loading states during generation. Create src/components/export/PDFPreview.tsx showing thumbnail preview of first page using html2canvas on visible scaled-down clone. Create src/components/export/HTMLPreview.tsx with iframe sandbox preview of generated HTML. Create src/components/export/ExportOptions.tsx with checkboxes for includeStakeholderMap, includeTimeline, includeBudgetDetails. Create src/hooks/useExport.ts with `exportPDF()`, `exportHTML()`, `isGenerating`, `progress` state, and error handling. Create src/lib/exportUtils.ts with `sanitizeFilename(name: string)`, `downloadBlob(blob: Blob, filename: string)`, and `formatDateForExport(date: Date)`. Create src/components/charter/FinalReview.tsx as pre-export step showing CompletenessChecker results, section-by-section status, and "Proceed to Export" button only when validation passes. Create src/components/charter/CharterPreview.tsx as read-only summary view of all charter data in clean card layout. Create src/components/ui/LoadingStates.tsx with SkeletonExport, GeneratingOverlay, and ProgressBar components. Create src/components/ui/EmptyStates.tsx with NoDataForExport and ExportError illustrations. Create src/components/ui

---

## Model-Specific Notes

Per-phase mode — optimized for Claude (Anthropic). Tech stack: React 18, TypeScript, Tailwind CSS, shadcn/ui, Zustand (state), React Hook Form + Zod (validation), OpenAI GPT-4 API, html2canvas + jsPDF (PDF export), vis-timeline (timeline viz), Vite, Supabase (storage/edge functions), Vercel (deploy). Each phase is self-contained: clear your conversation before pasting the next one.
