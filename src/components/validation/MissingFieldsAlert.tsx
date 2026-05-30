import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { useCompletenessValidation } from "@/hooks/useValidation";

/**
 * Dismissible banner listing the critical fields that still block PDF/HTML
 * export. Hidden once the charter is export-ready. Re-appears if new critical
 * gaps are introduced after dismissal.
 */
export function MissingFieldsAlert() {
  const { report } = useCompletenessValidation();
  const [dismissedFor, setDismissedFor] = useState<string | null>(null);

  if (report.isExportReady) return null;

  const signature = report.missingCritical.join("|");
  if (dismissedFor === signature) return null;

  return (
    <div className="flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
      <div className="flex-1">
        <p className="font-medium">
          {report.missingCritical.length} required field
          {report.missingCritical.length === 1 ? "" : "s"} block export
        </p>
        <ul className="mt-1 list-inside list-disc text-amber-800">
          {report.missingCritical.map((field) => (
            <li key={field}>{field}</li>
          ))}
        </ul>
      </div>
      <button
        type="button"
        onClick={() => setDismissedFor(signature)}
        className="text-amber-600 hover:text-amber-900"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
