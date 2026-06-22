import { useCallback, useEffect, useRef, useState } from "react";
import type { Charter, CharterSectionId, MinimalInputs } from "@/types/charter";
import type {
  ConfidenceScore,
  GeneratedSection,
  GenerationMetadata,
} from "@/types/ai";
import { generateCharterDraft } from "@/services/ai/charterGenerator";
import { scoreConfidence } from "@/services/ai/confidenceScorer";
import { mergeSectionIntoCharter } from "@/lib/applyGenerated";
import { useCharterStore } from "@/stores/charterStore";
import { getActiveByokConfig } from "@/stores/byokStore";

export interface GenerateExtra {
  templateContext?: string;
  existingCharter?: Charter;
  onlySectionId?: CharterSectionId;
}

/**
 * Drives AI charter generation: runs the draft, tracks elapsed time, and
 * applies accepted sections into the charter store.
 */
export function useCharterGeneration() {
  const selectTemplateId = useCharterStore((s) => s.charter.templateId);
  const setCharter = useCharterStore((s) => s.setCharter);

  const [isGenerating, setIsGenerating] = useState(false);
  const [sections, setSections] = useState<GeneratedSection[]>([]);
  const [metadata, setMetadata] = useState<GenerationMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Live elapsed-ms counter while a request is in flight.
  useEffect(() => {
    if (!isGenerating) {
      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = null;
      return;
    }
    const startedAt = performance.now();
    setElapsedMs(0);
    tickRef.current = setInterval(() => {
      setElapsedMs(Math.round(performance.now() - startedAt));
    }, 100);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = null;
    };
  }, [isGenerating]);

  const generate = useCallback(
    async (inputs: MinimalInputs, extra: GenerateExtra = {}) => {
      setIsGenerating(true);
      setError(null);
      setSections([]);
      setMetadata(null);
      try {
        const result = await generateCharterDraft(inputs, {
          templateId: selectTemplateId,
          templateContext: extra.templateContext,
          existingCharter: extra.existingCharter,
          onlySectionId: extra.onlySectionId,
        });
        setSections(result.sections);
        setMetadata(result.metadata);
        return result.sections;
      } catch (err) {
        setError((err as Error).message);
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
    setMetadata(null);
    setError(null);
    setElapsedMs(0);
  }, []);

  return {
    generate,
    applySections,
    reset,
    isGenerating,
    sections,
    metadata,
    error,
    elapsedMs,
  };
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
    async (
      section: GeneratedSection,
      sources: MinimalInputs,
      existingCharter?: Charter,
    ) => {
      setIsScoring(true);
      setError(null);
      try {
        const result = await scoreConfidence(section, sources, existingCharter);
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

  /** Score sections. Hosted mode runs in parallel for speed; local mode
   * (single local model) runs sequentially so requests don't queue and time
   * out. Either way, one section's failure doesn't drop the others, and
   * scores stream into state as they resolve. */
  const scoreAll = useCallback(
    async (
      toScore: GeneratedSection[],
      sources: MinimalInputs,
      existingCharter?: Charter,
    ) => {
      setIsScoring(true);
      setError(null);
      const results: ConfidenceScore[] = [];
      const errors: string[] = [];
      const isLocal = import.meta.env.VITE_LOCAL_AI === "true";
      // BYOK keys typically have low rate limits; serialize scoring to avoid
      // 429s, same as local-model mode. Hosted mode keeps parallelism.
      const isByok = getActiveByokConfig() !== null;
      const serialize = isLocal || isByok;
      try {
        if (serialize) {
          for (const section of toScore) {
            try {
              const r = await scoreConfidence(section, sources, existingCharter);
              results.push(r);
              setScores((prev) => ({ ...prev, [r.sectionId]: r }));
            } catch (err) {
              errors.push((err as Error).message);
            }
          }
        } else {
          const settled = await Promise.allSettled(
            toScore.map((s) => scoreConfidence(s, sources, existingCharter)),
          );
          settled.forEach((r) => {
            if (r.status === "fulfilled") {
              results.push(r.value);
            } else {
              errors.push(r.reason?.message ?? String(r.reason));
            }
          });
          setScores((prev) => {
            const next = { ...prev };
            results.forEach((r) => (next[r.sectionId] = r));
            return next;
          });
        }
        if (errors.length > 0) {
          setError(
            `Scoring failed for ${errors.length} of ${toScore.length} section(s). ${errors[0]}`,
          );
        }
        return results;
      } finally {
        setIsScoring(false);
      }
    },
    [],
  );

  const reset = useCallback(() => setScores({}), []);

  return { scoreSection, scoreAll, reset, scores, isScoring, error };
}
