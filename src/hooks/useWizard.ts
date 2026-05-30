import { useCallback, useMemo } from "react";
import { useCharterStore } from "@/stores/charterStore";
import {
  CHARTER_SECTION_IDS,
  SECTION_LABELS,
  type CharterSectionId,
} from "@/types/charter";

export interface WizardStep {
  id: CharterSectionId;
  label: string;
  index: number;
}

/**
 * Drives the multi-step charter wizard: ordered steps, current position,
 * and navigation guards. Step state lives in the charter store so it
 * survives re-renders and can be persisted.
 */
export function useWizard() {
  const currentStep = useCharterStore((s) => s.currentStep);
  const setCurrentStep = useCharterStore((s) => s.setCurrentStep);

  const steps = useMemo<WizardStep[]>(
    () =>
      CHARTER_SECTION_IDS.map((id, index) => ({
        id,
        label: SECTION_LABELS[id],
        index,
      })),
    [],
  );

  const totalSteps = steps.length;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;
  const activeStep = steps[currentStep];

  const goTo = useCallback(
    (index: number) => {
      if (index < 0 || index >= totalSteps) return;
      setCurrentStep(index);
    },
    [setCurrentStep, totalSteps],
  );

  const next = useCallback(() => {
    if (!isLastStep) setCurrentStep(currentStep + 1);
  }, [currentStep, isLastStep, setCurrentStep]);

  const back = useCallback(() => {
    if (!isFirstStep) setCurrentStep(currentStep - 1);
  }, [currentStep, isFirstStep, setCurrentStep]);

  const progressPercent = Math.round(((currentStep + 1) / totalSteps) * 100);

  return {
    steps,
    activeStep,
    currentStep,
    totalSteps,
    isFirstStep,
    isLastStep,
    progressPercent,
    goTo,
    next,
    back,
  };
}
