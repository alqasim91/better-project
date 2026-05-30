import { ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { confidenceBand, type ConfidenceScore } from "@/types/ai";
import { cn } from "@/lib/utils";

const BAND_STYLE = {
  high: { variant: "success" as const, Icon: ShieldCheck, label: "High confidence" },
  medium: { variant: "warning" as const, Icon: ShieldAlert, label: "Needs review" },
  low: { variant: "destructive" as const, Icon: ShieldX, label: "Low confidence" },
};

interface ConfidenceBadgeProps {
  score: ConfidenceScore;
  className?: string;
}

/**
 * A single confidence badge: color-coded (green ≥80, amber 50-79, red <50)
 * with the reasoning surfaced as a native tooltip.
 */
export function ConfidenceBadge({ score, className }: ConfidenceBadgeProps) {
  const band = confidenceBand(score.score);
  const { variant, Icon, label } = BAND_STYLE[band];
  const tooltip = [
    `${label} — ${score.score}/100`,
    score.reasoning,
    score.flags.length ? `Flags: ${score.flags.join("; ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <Badge variant={variant} className={cn("gap-1", className)} title={tooltip}>
      <Icon className="h-3 w-3" />
      {score.score}
    </Badge>
  );
}

interface ConfidenceIndicatorsProps {
  scores: Record<string, ConfidenceScore>;
  /** Section ids to render badges for, in order. */
  sectionIds: string[];
  labels: Record<string, string>;
  isScoring?: boolean;
}

/** Per-section list of confidence badges with their section labels. */
export function ConfidenceIndicators({
  scores,
  sectionIds,
  labels,
  isScoring,
}: ConfidenceIndicatorsProps) {
  return (
    <ul className="space-y-1.5">
      {sectionIds.map((id) => {
        const score = scores[id];
        return (
          <li key={id} className="flex items-center justify-between text-sm">
            <span>{labels[id] ?? id}</span>
            {score ? (
              <ConfidenceBadge score={score} />
            ) : (
              <span className="text-xs text-muted-foreground">
                {isScoring ? "Scoring…" : "—"}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
