import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, RotateCcw, FileDown } from "lucide-react";
import { useWizard } from "@/hooks/useWizard";
import { useFormPersistence, clearPersistedCharter } from "@/hooks/useFormPersistence";
import { useCharterStore } from "@/stores/charterStore";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StepNavigation } from "@/components/wizard/StepNavigation";
import { CompletenessChecker } from "@/components/validation/CompletenessChecker";
import { SectionStatusBar } from "@/components/validation/SectionStatusBar";
import { MissingFieldsAlert } from "@/components/validation/MissingFieldsAlert";
import { AutoGenerateModal } from "@/components/ai/AutoGenerateModal";
import { ProjectBasicsForm } from "@/components/forms/ProjectBasicsForm";
import { GoalsObjectivesForm } from "@/components/forms/GoalsObjectivesForm";
import { StakeholdersForm } from "@/components/forms/StakeholdersForm";
import { ScopeConstraintsForm } from "@/components/forms/ScopeConstraintsForm";
import { RiskAssumptionsForm } from "@/components/forms/RiskAssumptionsForm";
import { DeliverablesForm } from "@/components/forms/DeliverablesForm";
import { TimelineBudgetForm } from "@/components/forms/TimelineBudgetForm";
import type { CharterSectionId } from "@/types/charter";

/** Map each section id to its form component. */
const SECTION_FORMS: Record<CharterSectionId, () => JSX.Element> = {
  basics: ProjectBasicsForm,
  goals: GoalsObjectivesForm,
  stakeholders: StakeholdersForm,
  scope: ScopeConstraintsForm,
  risks: RiskAssumptionsForm,
  deliverables: DeliverablesForm,
  timeline: TimelineBudgetForm,
};

interface WizardContainerProps {
  /** Called when the user chooses to pick a different template. */
  onChangeTemplate?: () => void;
  /** Called when the user finishes the last step and wants to review/export. */
  onFinish?: () => void;
  /** Open the AI draft modal on mount (the AI-first entry path). */
  autoOpenAI?: boolean;
  /** Acknowledge that the auto-open was handled, so it fires only once. */
  onAutoOpenConsumed?: () => void;
}

/**
 * The Core Form Engine: renders the active section form alongside the step
 * rail and completeness sidebar. Hosts the Auto-Generate flow. Navigation is
 * free — completeness only gates the final export, not step-to-step movement.
 */
export function WizardContainer({
  onChangeTemplate,
  onFinish,
  autoOpenAI,
  onAutoOpenConsumed,
}: WizardContainerProps) {
  useFormPersistence();

  const { activeStep, isFirstStep, isLastStep, next, back } = useWizard();
  const reset = useCharterStore((s) => s.reset);
  const [aiOpen, setAiOpen] = useState(false);

  // AI-first path: open the draft modal once when entering the wizard.
  useEffect(() => {
    if (autoOpenAI) {
      setAiOpen(true);
      onAutoOpenConsumed?.();
    }
  }, [autoOpenAI, onAutoOpenConsumed]);

  const ActiveForm = SECTION_FORMS[activeStep.id];

  const handleReset = () => {
    reset();
    clearPersistedCharter();
    onChangeTemplate?.();
  };

  return (
    <div>
      <SectionStatusBar onAutoGenerate={() => setAiOpen(true)} />

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <StepNavigation />
          <Card>
            <CardContent className="pt-6">
              <CompletenessChecker />
            </CardContent>
          </Card>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground"
            onClick={handleReset}
          >
            <RotateCcw className="h-4 w-4" /> Start over
          </Button>
        </aside>

        <Card>
          <CardHeader>
            <CardTitle>{activeStep.label}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <MissingFieldsAlert />
            <ActiveForm />

            <div className="space-y-2 border-t pt-4">
              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={back} disabled={isFirstStep}>
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                {isLastStep ? (
                  <Button onClick={() => onFinish?.()}>
                    Review & Export <FileDown className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button onClick={next}>
                    Next <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <AutoGenerateModal open={aiOpen} onOpenChange={setAiOpen} />
    </div>
  );
}
