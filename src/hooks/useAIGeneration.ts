import { useCallback, useState } from "react";
import type { Charter, MinimalInputs } from "@/types/charter";
import type { ConfidenceScore, GeneratedSection } from "@/types/ai";
import { generateCharterDraft } from "@/services/ai/charterGenerator";
import { scoreConfidence } from "@/services/ai/confidenceScorer";
import { mergeSectionIntoCharter } from "@/lib/applyGenerated";
import { useCharterStore } from "@/stores/charterStore";

export interface GenerationProgress {
  step: number;
  total: number;
  label: string;
}

const PROGRESS_STEPS = [
  "Analyzing inputs…",
  "Drafting charter sections…",
  "Structuring output…",
  "Done",
];

/**
 * Drives AI charter generation: runs the draft, tracks staged progress, and
 * applies accepted sections into the charter store.
 */
export function useCharterGeneration() {
  const selectTemplateId = useCharterStore((s) => s.charter.templateId);
  const setCharter = useCharterStore((s) => s.setCharter);

  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [sections, setSections] = useState<GeneratedSection[]>([]);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(
    async (
      inputs: MinimalInputs,
      templateContext?: string,
      existingCharter?: Charter,
    ) => {
      setIsGenerating(true);
      setError(null);
      setSections([]);
      setProgress({ step: 1, total: PROGRESS_STEPS.length, label: PROGRESS_STEPS[0] });
      try {
        setProgress({ step: 2, total: PROGRESS_STEPS.length, label: PROGRESS_STEPS[1] });
        const result = await generateCharterDraft(inputs, {
          templateId: selectTemplateId,
          templateContext,
          existingCharter,
        });
        setProgress({ step: 3, total: PROGRESS_STEPS.length, label: PROGRESS_STEPS[2] });
        setSections(result);
        setProgress({ step: 4, total: PROGRESS_STEPS.length, label: PROGRESS_STEPS[3] });
        return result;
      } catch (err) {
        setError((err as Error).message);
        setProgress(null);
        return [];
      } finally {
        setIsGenerating(false);
      }
    },
    [selectTemplateId],
  );

  /** Merge the given generated sections into the charter store. */
  const applySections = useCallback(
    (toApply: GeneratedSection[]) => {
      const current = useCharterStore.getState().charter;
      const merged = toApply.reduce(
        (charter, section) => mergeSectionIntoCharter(charter, section),
        current,
      );
      setCharter(merged);
    },
    [setCharter],
  );

  const reset = useCallback(() => {
    setSections([]);
    setProgress(null);
    setError(null);
  }, []);

  return { generate, applySections, reset, isGenerating, progress, sections, error };
}

/**
 * Scores generated sections for confidence. Scores accumulate keyed by
 * section id so the UI can render badges as each resolves.
 */
export function useConfidenceScoring() {
  const [scores, setScores] = useState<Record<string, ConfidenceScore>>({});
  const [isScoring, setIsScoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scoreSection = useCallback(
    async (section: GeneratedSection, sources: MinimalInputs) => {
      setIsScoring(true);
      setError(null);
      try {
        const result = await scoreConfidence(section, sources);
        setScores((prev) => ({ ...prev, [section.sectionId]: result }));
        return result;
      } catch (err) {
        setError((err as Error).message);
        return null;
      } finally {
        setIsScoring(false);
      }
    },
    [],
  );

  /** Score many sections in parallel. */
  const scoreAll = useCallback(
    async (toScore: GeneratedSection[], sources: MinimalInputs) => {
      setIsScoring(true);
      setError(null);
      try {
        const results = await Promise.all(
          toScore.map((s) => scoreConfidence(s, sources)),
        );
        setScores((prev) => {
          const next = { ...prev };
          results.forEach((r) => (next[r.sectionId] = r));
          return next;
        });
        return results;
      } catch (err) {
        setError((err as Error).message);
        return [];
      } finally {
        setIsScoring(false);
      }
    },
    [],
  );

  const reset = useCallback(() => setScores({}), []);

  return { scoreSection, scoreAll, reset, scores, isScoring, error };
}
