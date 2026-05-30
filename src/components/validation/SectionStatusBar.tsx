import { Sparkles } from "lucide-react";
import { useCompletenessValidation } from "@/hooks/useValidation";
import { useWizard } from "@/hooks/useWizard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SectionStatusBarProps {
  /** Opens the Auto-Generate modal. */
  onAutoGenerate: () => void;
}

/**
 * Sticky header summarizing overall completeness with quick-jump chips to any
 * incomplete section, plus the Auto-Generate entry point.
 */
export function SectionStatusBar({ onAutoGenerate }: SectionStatusBarProps) {
  const { report, completenessPercent } = useCompletenessValidation();
  const { goTo, steps } = useWizard();

  const incomplete = report.sections.filter((s) => s.missing.length > 0);
  const barColor =
    completenessPercent >= 80
      ? "bg-emerald-500"
      : completenessPercent >= 60
        ? "bg-amber-500"
        : "bg-primary";

  return (
    <div className="sticky top-0 z-20 -mx-4 mb-6 border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="text-sm font-medium">
            {completenessPercent}% complete
          </div>
          <div className="h-2 w-32 overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full transition-all", barColor)}
              style={{ width: `${completenessPercent}%` }}
            />
          </div>
        </div>

        <Button size="sm" variant="secondary" onClick={onAutoGenerate}>
          <Sparkles className="h-4 w-4" /> Auto-generate
        </Button>
      </div>

      {incomplete.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Jump to:</span>
          {incomplete.map((section) => {
            const stepIndex = steps.find((s) => s.id === section.section)?.index ?? 0;
            return (
              <button
                key={section.section}
                type="button"
                onClick={() => goTo(stepIndex)}
                className="rounded-full border bg-muted/40 px-2 py-0.5 text-xs hover:bg-accent"
              >
                {section.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
