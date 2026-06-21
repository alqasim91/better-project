import { useMemo, useState } from "react";
import { Check, X, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { diffSection, type FieldDiff } from "@/lib/charterDiff";
import { SECTION_LABELS, type Charter } from "@/types/charter";
import type { ConfidenceScore, GeneratedSection } from "@/types/ai";

interface Props {
  charter: Charter;
  sections: GeneratedSection[];
  scores: Record<string, ConfidenceScore>;
  /** Per-section decision: undefined means "accepted" (default in refine mode). */
  rejected: Record<string, boolean>;
  onToggleReject: (sectionId: string) => void;
}

/**
 * Refine-mode diff viewer. Shows every section with expandable per-field
 * changes (old → new) and a per-section reject toggle. Confidence score is
 * surfaced as a small badge per section.
 */
export function RefineDiffReview({
  charter,
  sections,
  scores,
  rejected,
  onToggleReject,
}: Props) {
  const diffs = useMemo(
    () => sections.map((s) => ({ section: s, diff: diffSection(charter, s) })),
    [charter, sections],
  );

  const changedCount = diffs.filter((d) => d.diff.hasChanges).length;

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        AI proposed changes to {changedCount} of {diffs.length} sections.
        Review each one and uncheck any you don't want.
      </p>

      <div className="space-y-2">
        {diffs.map(({ section, diff }) => (
          <SectionDiffRow
            key={section.sectionId}
            section={section}
            diff={diff}
            score={scores[section.sectionId]}
            isRejected={Boolean(rejected[section.sectionId])}
            onToggleReject={() => onToggleReject(section.sectionId)}
          />
        ))}
      </div>
    </div>
  );
}

interface RowProps {
  section: GeneratedSection;
  diff: ReturnType<typeof diffSection>;
  score?: ConfidenceScore;
  isRejected: boolean;
  onToggleReject: () => void;
}

function SectionDiffRow({
  section,
  diff,
  score,
  isRejected,
  onToggleReject,
}: RowProps) {
  const [expanded, setExpanded] = useState(false);

  const changedFields = diff.fields.filter(
    (f) =>
      f.kind === "filled" ||
      f.kind === "modified" ||
      (f.kind === "list" &&
        f.listSummary !== undefined &&
        f.listSummary.before !== f.listSummary.after),
  );

  return (
    <div
      className={`rounded-md border ${
        isRejected ? "border-muted bg-muted/30 opacity-60" : "bg-background"
      }`}
    >
      <div className="flex items-center justify-between gap-2 p-3">
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="flex items-center gap-2 text-left"
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <div>
            <p className="text-sm font-medium">{SECTION_LABELS[section.sectionId]}</p>
            <p className="text-xs text-muted-foreground">
              {diff.hasChanges
                ? `${changedFields.length} change${changedFields.length === 1 ? "" : "s"}`
                : "No changes"}
              {score && (
                <>
                  {" · "}
                  <span
                    className={
                      score.score >= 80
                        ? "text-emerald-700"
                        : score.score >= 50
                          ? "text-amber-700"
                          : "text-red-700"
                    }
                  >
                    {score.score}/100 confidence
                  </span>
                </>
              )}
            </p>
          </div>
        </button>

        <Button
          type="button"
          size="sm"
          variant={isRejected ? "outline" : "ghost"}
          onClick={onToggleReject}
        >
          {isRejected ? (
            <>
              <Check className="h-3.5 w-3.5" /> Re-include
            </>
          ) : (
            <>
              <X className="h-3.5 w-3.5" /> Skip this
            </>
          )}
        </Button>
      </div>

      {expanded && (
        <div className="border-t bg-muted/20 p-3 space-y-2">
          {diff.fields.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No tracked fields for this section.
            </p>
          )}
          {diff.fields.map((f, i) => (
            <FieldDiffRow key={i} diff={f} />
          ))}
          {section.summary && (
            <div className="mt-2 rounded border-l-2 border-primary/40 bg-background px-2 py-1 text-xs italic text-muted-foreground">
              AI: {section.summary}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FieldDiffRow({ diff }: { diff: FieldDiff }) {
  if (diff.kind === "unchanged") {
    return (
      <div className="text-xs text-muted-foreground">
        <span className="font-medium">{diff.label}:</span> unchanged
      </div>
    );
  }
  if (diff.kind === "list") {
    const { before = 0, after = 0 } = diff.listSummary ?? {};
    const delta = after - before;
    return (
      <div className="text-xs">
        <span className="font-medium">{diff.label}:</span>{" "}
        <span className="text-muted-foreground">
          {before} → {after}
        </span>{" "}
        {delta > 0 && <span className="text-emerald-700">(+{delta} new)</span>}
        {delta < 0 && <span className="text-red-700">({delta} removed)</span>}
        {delta === 0 && before > 0 && (
          <span className="text-muted-foreground">(reordered or restated)</span>
        )}
      </div>
    );
  }
  // filled or modified
  return (
    <div className="space-y-1 text-xs">
      <div className="font-medium">{diff.label}</div>
      {diff.kind === "filled" ? (
        <div className="rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-emerald-900">
          <span className="font-medium">Filled in: </span>
          {diff.newValue || <em className="text-muted-foreground">(empty)</em>}
        </div>
      ) : (
        <div className="grid gap-1 sm:grid-cols-2">
          <div className="rounded border border-red-200 bg-red-50 px-2 py-1 text-red-900 line-through">
            {diff.oldValue}
          </div>
          <div className="rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-emerald-900">
            {diff.newValue}
          </div>
        </div>
      )}
    </div>
  );
}
