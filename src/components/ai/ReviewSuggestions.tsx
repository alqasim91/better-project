import { Check, X, Pencil, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { confidenceBand, type ConfidenceScore, type GeneratedSection } from "@/types/ai";

export type SuggestionAction = "accept" | "reject" | "modify";

interface ReviewSuggestionsProps {
  sections: GeneratedSection[];
  scores: Record<string, ConfidenceScore>;
  /** Per-section decision the user has made so far. */
  decisions: Record<string, SuggestionAction>;
  onDecision: (sectionId: string, action: SuggestionAction) => void;
  /** Threshold under which a section is treated as a low-confidence extrapolation. */
  threshold?: number;
}

/**
 * Surfaces low-confidence generated sections so the user can accept, reject,
 * or modify each before it is merged into the charter. Sections above the
 * threshold are summarized as auto-accepted.
 */
export function ReviewSuggestions({
  sections,
  scores,
  decisions,
  onDecision,
  threshold = 50,
}: ReviewSuggestionsProps) {
  const lowConfidence = sections.filter((s) => {
    const score = scores[s.sectionId];
    return score && confidenceBand(score.score) === "low";
  });

  const flagged = sections.filter((s) => {
    const score = scores[s.sectionId];
    return score ? score.score < threshold : false;
  });

  const scoredCount = sections.filter((s) => scores[s.sectionId]).length;
  const noScoresAtAll = scoredCount === 0;

  if (flagged.length === 0) {
    if (noScoresAtAll) {
      return (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <AlertTriangle className="mr-1 inline h-4 w-4" />
          Confidence scoring is unavailable — please review each generated section
          carefully before applying.
        </div>
      );
    }
    return (
      <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
        <Check className="mr-1 inline h-4 w-4" />
        No low-confidence extrapolations — all {scoredCount} sections are well
        grounded.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {lowConfidence.length} section{lowConfidence.length === 1 ? "" : "s"} need
        a closer look before accepting.
      </p>

      {flagged.map((section) => {
        const score = scores[section.sectionId];
        const decision = decisions[section.sectionId];
        return (
          <div
            key={section.sectionId}
            className="space-y-2 rounded-md border border-amber-200 bg-amber-50/60 p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium">{section.title}</p>
                {score && (
                  <p className="mt-0.5 text-xs text-amber-700">{score.reasoning}</p>
                )}
              </div>
              {score && (
                <span className="shrink-0 text-xs font-semibold text-amber-700">
                  {score.score}/100
                </span>
              )}
            </div>

            {score && score.flags.length > 0 && (
              <ul className="space-y-0.5">
                {score.flags.map((flag, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-1 text-xs text-amber-800"
                  >
                    <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                    {flag}
                  </li>
                ))}
              </ul>
            )}

            <div className="flex gap-2">
              <Button
                size="sm"
                variant={decision === "accept" ? "default" : "outline"}
                onClick={() => onDecision(section.sectionId, "accept")}
              >
                <Check className="h-3.5 w-3.5" /> Accept
              </Button>
              <Button
                size="sm"
                variant={decision === "modify" ? "default" : "outline"}
                onClick={() => onDecision(section.sectionId, "modify")}
              >
                <Pencil className="h-3.5 w-3.5" /> Modify
              </Button>
              <Button
                size="sm"
                variant={decision === "reject" ? "destructive" : "outline"}
                onClick={() => onDecision(section.sectionId, "reject")}
              >
                <X className="h-3.5 w-3.5" /> Reject
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
