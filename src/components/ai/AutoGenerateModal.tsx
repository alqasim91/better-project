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
    const sections = await generation.generate(
      inputs,
      template?.description,
      hasExistingContent ? charter : undefined,
    );
    setDecisions({});
    if (sections.length > 0) {
      await scoring.scoreAll(sections, inputs);
    }
  };

  const handleApply = () => {
    // Apply every section the user did not explicitly reject.
    const accepted = generation.sections.filter(
      (s) => decisions[s.sectionId] !== "reject",
    );
    generation.applySections(accepted);
    handleClose();
  };

  const handleClose = () => {
    generation.reset();
    scoring.reset();
    setDecisions({});
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
              <Label htmlFor="ai-goals">
                {hasExistingContent ? "Extra context — goals (optional)" : "Primary goals"}
              </Label>
              <Textarea
                id="ai-goals"
                rows={2}
                value={inputs.goals}
                placeholder={
                  hasExistingContent
                    ? "Anything not yet in the charter you want AI to incorporate?"
                    : "What should this project achieve?"
                }
                onChange={(e) => setInputs({ ...inputs, goals: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ai-stakeholders">
                {hasExistingContent ? "Extra context — stakeholders (optional)" : "Key stakeholders"}
              </Label>
              <Textarea
                id="ai-stakeholders"
                rows={2}
                value={inputs.stakeholders}
                placeholder={
                  hasExistingContent
                    ? "Additional stakeholders to consider?"
                    : "Who's involved or affected?"
                }
                onChange={(e) =>
                  setInputs({ ...inputs, stakeholders: e.target.value })
                }
              />
            </div>

            {generation.progress && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {generation.progress.label} (step {generation.progress.step}/
                {generation.progress.total})
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
              <h3 className="mb-2 text-sm font-semibold">Generated sections</h3>
              <ConfidenceIndicators
                scores={scoring.scores}
                sectionIds={sectionIds}
                labels={SECTION_LABELS}
                isScoring={scoring.isScoring}
              />
            </div>

            <ReviewSuggestions
              sections={generation.sections}
              scores={scoring.scores}
              decisions={decisions}
              onDecision={(id, action) =>
                setDecisions((prev) => ({ ...prev, [id]: action }))
              }
            />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          {!hasResults ? (
            <Button
              onClick={handleGenerate}
              disabled={generation.isGenerating || !inputs.projectName.trim()}
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
