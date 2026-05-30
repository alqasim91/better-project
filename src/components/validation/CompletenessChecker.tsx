import { Check, Circle } from "lucide-react";
import { useCompletenessValidation } from "@/hooks/useValidation";
import { useWizard } from "@/hooks/useWizard";
import { cn } from "@/lib/utils";

function ProgressRing({ percent }: { percent: number }) {
  const size = 96;
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  const color =
    percent >= 80 ? "stroke-emerald-500" : percent >= 60 ? "stroke-amber-500" : "stroke-primary";

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={stroke}
        className="stroke-muted"
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className={cn("transition-all duration-500", color)}
        fill="none"
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
        className="rotate-90 fill-foreground text-lg font-semibold"
        style={{ transformOrigin: "center" }}
      >
        {percent}%
      </text>
    </svg>
  );
}

/**
 * Circular overall completeness plus a section-by-section breakdown.
 * Clicking a section jumps the wizard to it.
 */
export function CompletenessChecker() {
  const { report } = useCompletenessValidation();
  const { goTo, steps } = useWizard();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <ProgressRing percent={report.percent} />
        <div>
          <p className="text-sm font-medium">Charter completeness</p>
          <p className="text-sm text-muted-foreground">
            {report.isExportReady
              ? "All required fields are present."
              : `${report.missingCritical.length} required field${
                  report.missingCritical.length === 1 ? "" : "s"
                } still needed for export.`}
          </p>
        </div>
      </div>

      <ul className="space-y-1">
        {report.sections.map((section) => {
          const stepIndex = steps.find((s) => s.id === section.section)?.index ?? 0;
          const done = section.missing.length === 0;
          return (
            <li key={section.section}>
              <button
                type="button"
                onClick={() => goTo(stepIndex)}
                className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
              >
                <span className="flex items-center gap-2">
                  {done ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground" />
                  )}
                  {section.label}
                </span>
                <span className="text-xs text-muted-foreground">{section.percent}%</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
