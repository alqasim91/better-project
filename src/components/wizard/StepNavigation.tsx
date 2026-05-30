import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWizard } from "@/hooks/useWizard";

/**
 * Vertical step rail with progress. Completed steps are clickable to jump
 * back; future steps are reachable too (Phase 2 wires in completeness gating).
 */
export function StepNavigation() {
  const { steps, currentStep, goTo, progressPercent } = useWizard();

  return (
    <nav aria-label="Charter sections" className="space-y-4">
      <div>
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>Progress</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <ol className="space-y-1">
        {steps.map((step) => {
          const isActive = step.index === currentStep;
          const isComplete = step.index < currentStep;
          return (
            <li key={step.id}>
              <button
                type="button"
                onClick={() => goTo(step.index)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors",
                  isActive
                    ? "bg-primary/10 font-medium text-primary"
                    : "hover:bg-accent",
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs",
                    isActive && "border-primary text-primary",
                    isComplete && "border-primary bg-primary text-primary-foreground",
                  )}
                >
                  {isComplete ? <Check className="h-3.5 w-3.5" /> : step.index + 1}
                </span>
                <span>{step.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
