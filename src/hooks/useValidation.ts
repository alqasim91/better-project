import { useEffect, useMemo, useState } from "react";
import { useCharterStore } from "@/stores/charterStore";
import {
  computeCompleteness,
  type CompletenessReport,
} from "@/lib/completeness";

const DEBOUNCE_MS = 250;
/** Minimum completeness required to advance through the wizard. */
export const MIN_COMPLETENESS_TO_PROCEED = 60;

/**
 * Real-time, debounced completeness validation. Recomputes the report shortly
 * after the charter changes so rapid typing doesn't thrash.
 */
export function useCompletenessValidation() {
  const charter = useCharterStore((s) => s.charter);
  const [report, setReport] = useState<CompletenessReport>(() =>
    computeCompleteness(charter),
  );

  useEffect(() => {
    const t = setTimeout(() => setReport(computeCompleteness(charter)), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [charter]);

  return useMemo(
    () => ({
      report,
      missingFields: report.missingFields,
      completenessPercent: report.percent,
      /** Whether the charter clears the wizard progression threshold. */
      isValid: report.percent >= MIN_COMPLETENESS_TO_PROCEED,
      /** Whether all critical fields are present (export readiness). */
      isExportReady: report.isExportReady,
      checkCompleteness: () => computeCompleteness(charter),
    }),
    [report, charter],
  );
}
