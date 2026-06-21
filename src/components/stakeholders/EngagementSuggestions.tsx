import { useState } from "react";
import { Sparkles, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCharterStore } from "@/stores/charterStore";
import { getQuadrant } from "@/lib/stakeholderLayout";
import {
  suggestEngagement,
  type EngagementSuggestion,
} from "@/services/ai/engagementSuggester";
import { getActiveByokConfig } from "@/stores/byokStore";
import type { Stakeholder } from "@/types/charter";

type Suggestions = Record<string, EngagementSuggestion>;

/**
 * AI-powered engagement strategy panel. Generates a concrete, per-stakeholder
 * strategy bucket (one summary + three actions) grounded in the project
 * context. Runs serialized in BYOK mode (rate-limit friendly).
 */
export function EngagementSuggestions() {
  const charter = useCharterStore((s) => s.charter);
  const stakeholders = charter.stakeholders.stakeholders;

  const [running, setRunning] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestions>({});
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const handleRun = async () => {
    if (stakeholders.length === 0) return;
    setRunning(true);
    setError(null);
    setSuggestions({});
    setProgress({ done: 0, total: stakeholders.length });

    const isByok = getActiveByokConfig() !== null;
    const results: Suggestions = {};

    try {
      // Serialize when BYOK is on (low rate limits); otherwise the loop is
      // still simple enough to stay sequential — most projects have a handful
      // of stakeholders.
      if (isByok || true) {
        for (const s of stakeholders) {
          try {
            const result = await suggestEngagement(s, getQuadrant(s), charter);
            results[s.id] = result;
            setSuggestions({ ...results });
          } catch (err) {
            setError(
              `Failed for ${s.name || "one stakeholder"}: ${(err as Error).message}`,
            );
          }
          setProgress((p) => ({ ...p, done: p.done + 1 }));
        }
      }
    } finally {
      setRunning(false);
    }
  };

  if (stakeholders.length === 0) {
    return null;
  }

  const hasAny = Object.keys(suggestions).length > 0;

  return (
    <div className="space-y-3 rounded-lg border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">AI engagement strategies</h3>
          <p className="text-xs text-muted-foreground">
            Get a concrete approach per stakeholder based on their quadrant
            and your project context.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={handleRun}
          disabled={running}
        >
          {running ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {progress.done}/{progress.total}
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              {hasAny ? "Regenerate" : "Suggest strategies"}
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      )}

      {hasAny && (
        <ul className="space-y-2">
          {stakeholders.map((s: Stakeholder) => {
            const suggestion = suggestions[s.id];
            if (!suggestion) return null;
            return (
              <li
                key={s.id}
                className="space-y-1 rounded-md border bg-muted/20 p-3"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-medium">
                    {s.name || "Unnamed stakeholder"}
                  </p>
                  <p className="text-xs text-muted-foreground">{s.role}</p>
                </div>
                {suggestion.summary && (
                  <p className="text-sm text-muted-foreground">
                    {suggestion.summary}
                  </p>
                )}
                {suggestion.actions.length > 0 && (
                  <ul className="ml-4 list-disc space-y-0.5 text-sm">
                    {suggestion.actions.map((action, i) => (
                      <li key={i}>{action}</li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
