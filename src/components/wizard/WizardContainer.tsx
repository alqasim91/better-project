import { useState } from "react";
import { ArrowLeft, ArrowRight, RotateCcw, Lock, FileDown } from "lucide-react";
import { useWizard } from "@/hooks/useWizard";
import { useFormPersistence, clearPersistedCharter } from "@/hooks/useFormPersistence";
import {
  useCompletenessValidation,
  MIN_COMPLETENESS_TO_PROCEED,
} from "@/hooks/useValidation";
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
}

/**
 * The Core Form Engine: renders the active section form alongside the step
 * rail and completeness sidebar. Hosts the Auto-Generate flow and gates
 * progression on the 60% completeness threshold.
 */
export function WizardContainer({ onChangeTemplate, onFinish }: WizardContainerProps) {
  useFormPersistence();

  const { activeStep, isFirstStep, isLastStep, next, back } = useWizard();
  const { completenessPercent, isValid } = useCompletenessValidation();
  const reset = useCharterStore((s) => s.reset);
  const [aiOpen, setAiOpen] = useState(false);

  const ActiveForm = SECTION_FORMS[activeStep.id];
  // Progression past the first step requires clearing the completeness gate.
  const canProceed = isValid || isFirstStep;

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
              {!canProceed && (
                <p className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  Reach {MIN_COMPLETENESS_TO_PROCEED}% completeness to continue
                  (currently {completenessPercent}%).
                </p>
              )}
              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={back} disabled={isFirstStep}>
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                {isLastStep ? (
                  <Button onClick={() => onFinish?.()} disabled={!canProceed}>
                    Review & Export <FileDown className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button onClick={next} disabled={!canProceed}>
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
