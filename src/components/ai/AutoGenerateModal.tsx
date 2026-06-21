import { useMemo, useState } from "react";
import { Sparkles, Loader2, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useCharterGeneration,
  useConfidenceScoring,
} from "@/hooks/useAIGeneration";
import { useCharterStore } from "@/stores/charterStore";
import { getTemplateById } from "@/lib/templateRegistry";
import { SECTION_LABELS, type MinimalInputs } from "@/types/charter";
import { ConfidenceIndicators } from "@/components/ai/ConfidenceIndicators";
import {
  ReviewSuggestions,
  type SuggestionAction,
} from "@/components/ai/ReviewSuggestions";
import { RefineDiffReview } from "@/components/ai/RefineDiffReview";

interface AutoGenerateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Hybrid AI generation flow: collect minimal inputs, draft all sections,
 * score each for confidence, let the user review low-confidence ones, then
 * merge accepted sections into the charter.
 */
export function AutoGenerateModal({ open, onOpenChange }: AutoGenerateModalProps) {
  const charter = useCharterStore((s) => s.charter);
  const template = charter.templateId ? getTemplateById(charter.templateId) : undefined;

  const generation = useCharterGeneration();
  const scoring = useConfidenceScoring();

  const [inputs, setInputs] = useState<MinimalInputs>({
    projectName: charter.basics.projectName,
    goals: "",
    stakeholders: "",
    industry: template?.industry,
  });
  const [decisions, setDecisions] = useState<Record<string, SuggestionAction>>({});
  /** In refine mode: per-section reject flag (default: accepted). */
  const [refineRejected, setRefineRejected] = useState<Record<string, boolean>>({});

  const hasResults = generation.sections.length > 0;

  // Detect whether the user has typed enough that we should refine rather than
  // start from scratch. Mirrors hasMeaningfulContent() in the server prompt.
  const hasExistingContent =
    Boolean(charter.basics.summary?.trim()) ||
    Boolean(charter.basics.sponsor?.trim()) ||
    Boolean(charter.basics.projectManager?.trim()) ||
    Boolean(charter.goals.visionStatement?.trim()) ||
    Boolean(charter.goals.businessCase?.trim()) ||
    charter.goals.objectives.length > 0 ||
    charter.stakeholders.stakeholders.length > 0 ||
    charter.scope.inScope.length > 0 ||
    charter.scope.outOfScope.length > 0 ||
    charter.deliverables.deliverables.length > 0 ||
    charter.risks.risks.length > 0 ||
    charter.timeline.milestones.length > 0;

  const handleGenerate = async () => {
    const sections = await generation.generate(inputs, {
      templateContext: template?.description,
      existingCharter: hasExistingContent ? charter : undefined,
    });
    setDecisions({});
    setRefineRejected({});
    if (sections.length > 0) {
      await scoring.scoreAll(
        sections,
        inputs,
        hasExistingContent ? charter : undefined,
      );
    }
  };

  const handleApply = () => {
    // In refine mode, the user explicitly rejects per section via the diff
    // viewer. In cold-start mode, low-confidence sections can be rejected via
    // ReviewSuggestions. Both feed the same "exclude" semantic.
    const accepted = generation.sections.filter((s) =>
      hasExistingContent
        ? !refineRejected[s.sectionId]
        : decisions[s.sectionId] !== "reject",
    );
    generation.applySections(accepted);
    handleClose();
  };

  const handleClose = () => {
    generation.reset();
    scoring.reset();
    setDecisions({});
    setRefineRejected({});
    onOpenChange(false);
  };

  const sectionIds = useMemo(
    () => generation.sections.map((s) => s.sectionId),
    [generation.sections],
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl" onClose={handleClose}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {hasExistingContent ? "Refine charter with AI" : "Auto-generate charter"}
          </DialogTitle>
          <DialogDescription>
            {hasExistingContent
              ? "AI will polish your existing wording, fill empty fields, and preserve every fact you've entered (names, dates, numbers). Optionally add extra context below."
              : "Give a few details and AI will draft every section. Each is scored for confidence so you can review extrapolations before accepting."}
          </DialogDescription>
        </DialogHeader>

        {!hasResults ? (
          <div className="space-y-4">
            {hasExistingContent ? (
              <>
                <div className="rounded-md border bg-muted/40 p-3 text-sm">
                  <p className="font-medium">AI will refine these sections you've already filled:</p>
                  <ul className="mt-2 space-y-1 text-muted-foreground">
                    {charter.basics.projectName && (
                      <li>• <span className="text-foreground">Project basics</span> — {charter.basics.projectName}</li>
                    )}
                    {(charter.goals.visionStatement || charter.goals.objectives.length > 0) && (
                      <li>• <span className="text-foreground">Goals</span> — {charter.goals.objectives.length} objective{charter.goals.objectives.length === 1 ? "" : "s"}</li>
                    )}
                    {charter.stakeholders.stakeholders.length > 0 && (
                      <li>• <span className="text-foreground">Stakeholders</span> — {charter.stakeholders.stakeholders.length}</li>
                    )}
                    {(charter.scope.inScope.length > 0 || charter.scope.outOfScope.length > 0) && (
                      <li>• <span className="text-foreground">Scope</span> — {charter.scope.inScope.length} in / {charter.scope.outOfScope.length} out</li>
                    )}
                    {(charter.risks.risks.length > 0 || charter.risks.assumptions.length > 0) && (
                      <li>• <span className="text-foreground">Risks</span> — {charter.risks.risks.length}</li>
                    )}
                    {charter.deliverables.deliverables.length > 0 && (
                      <li>• <span className="text-foreground">Deliverables</span> — {charter.deliverables.deliverables.length}</li>
                    )}
                    {charter.timeline.milestones.length > 0 && (
                      <li>• <span className="text-foreground">Timeline</span> — {charter.timeline.milestones.length} milestone{charter.timeline.milestones.length === 1 ? "" : "s"}</li>
                    )}
                  </ul>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Your existing facts (names, dates, numbers) will be preserved. Empty fields will be filled in.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ai-notes">Anything else AI should know? (optional)</Label>
                  <Textarea
                    id="ai-notes"
                    rows={2}
                    value={inputs.goals}
                    placeholder="Extra context, constraints, or goals not yet captured in the form."
                    onChange={(e) => setInputs({ ...inputs, goals: e.target.value })}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="ai-name">Project name</Label>
                  <Input
                    id="ai-name"
                    value={inputs.projectName}
                    placeholder="e.g. Customer Portal Redesign"
                    onChange={(e) => setInputs({ ...inputs, projectName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ai-goals">Primary goals</Label>
                  <Textarea
                    id="ai-goals"
                    rows={2}
                    value={inputs.goals}
                    placeholder="What should this project achieve?"
                    onChange={(e) => setInputs({ ...inputs, goals: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ai-stakeholders">Key stakeholders</Label>
                  <Textarea
                    id="ai-stakeholders"
                    rows={2}
                    value={inputs.stakeholders}
                    placeholder="Who's involved or affected?"
                    onChange={(e) =>
                      setInputs({ ...inputs, stakeholders: e.target.value })
                    }
                  />
                </div>
              </>
            )}

            {generation.isGenerating && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {generation.seqProgress ? (
                    <>
                      Drafting <span className="font-medium">{generation.seqProgress.label}</span>
                      {" "}
                      <span className="text-xs">
                        ({generation.seqProgress.index + 1} of {generation.seqProgress.total})
                      </span>
                      {" — "}
                      <span className="font-mono">
                        {(generation.elapsedMs / 1000).toFixed(1)}s
                      </span>
                    </>
                  ) : (
                    <>
                      {hasExistingContent ? "Refining your charter" : "Drafting your charter"}
                      {" — "}
                      <span className="font-mono">
                        {(generation.elapsedMs / 1000).toFixed(1)}s
                      </span>
                    </>
                  )}
                </div>
                {generation.seqProgress && (
                  <div className="space-y-1">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{
                          width: `${(generation.seqProgress.index / generation.seqProgress.total) * 100}%`,
                        }}
                      />
                    </div>
                    {generation.sections.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Completed: {generation.sections.map((s) => s.title).join(", ")}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {generation.error && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {generation.error}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <h3 className="text-sm font-semibold">Generated sections</h3>
                {generation.metadata && (
                  <p className="text-xs text-muted-foreground">
                    Generated by{" "}
                    <span className="font-mono">{generation.metadata.model}</span>
                    {" · "}
                    {(generation.elapsedMs / 1000).toFixed(1)}s
                    {generation.metadata.tokensUsed > 0 && (
                      <> · {generation.metadata.tokensUsed} tokens</>
                    )}
                  </p>
                )}
              </div>
              <ConfidenceIndicators
                scores={scoring.scores}
                sectionIds={sectionIds}
                labels={SECTION_LABELS}
                isScoring={scoring.isScoring}
              />
            </div>

            {hasExistingContent ? (
              <RefineDiffReview
                charter={charter}
                sections={generation.sections}
                scores={scoring.scores}
                rejected={refineRejected}
                onToggleReject={(id) =>
                  setRefineRejected((prev) => ({ ...prev, [id]: !prev[id] }))
                }
              />
            ) : (
              <ReviewSuggestions
                sections={generation.sections}
                scores={scoring.scores}
                decisions={decisions}
                isScoring={scoring.isScoring}
                onDecision={(id, action) =>
                  setDecisions((prev) => ({ ...prev, [id]: action }))
                }
              />
            )}

            {scoring.error && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {scoring.error}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          {!hasResults ? (
            <Button
              onClick={handleGenerate}
              disabled={
                generation.isGenerating ||
                (!hasExistingContent && !inputs.projectName.trim())
              }
            >
              {generation.isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {hasExistingContent ? "Refining…" : "Generating…"}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {hasExistingContent ? "Refine with AI" : "Generate"}
                </>
              )}
            </Button>
          ) : (
            <Button onClick={handleApply}>Apply to charter</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
