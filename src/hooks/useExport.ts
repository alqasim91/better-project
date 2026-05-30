import { useCallback, useState } from "react";
import { useCharterStore } from "@/stores/charterStore";
import { downloadBlob, sanitizeFilename } from "@/lib/exportUtils";

/** Re-export so consumers don't need a separate import. */
export type { HTMLExportOptions } from "@/services/export/htmlGenerator";

export interface ExportProgress {
  step: string;
  percent: number;
}

/**
 * Drives PDF and HTML export from the charter store. The heavy libraries
 * (jsPDF, html2canvas) are lazily imported so they don't bloat the initial
 * bundle — only loaded when the user actually clicks Export.
 */
export function useExport() {
  const charter = useCharterStore((s) => s.charter);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const exportPDF = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    setProgress({ step: "Loading PDF engine…", percent: 10 });
    try {
      const { generatePDF } = await import("@/services/export/pdfGenerator");
      setProgress({ step: "Generating PDF…", percent: 40 });
      const blob = await generatePDF(charter);
      setProgress({ step: "Preparing download…", percent: 90 });
      const filename = `${sanitizeFilename(charter.basics.projectName)}-charter.pdf`;
      downloadBlob(blob, filename);
      setProgress({ step: "Done", percent: 100 });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsGenerating(false);
      setTimeout(() => setProgress(null), 1500);
    }
  }, [charter]);

  const exportHTML = useCallback(
    async (options?: Partial<import("@/services/export/htmlGenerator").HTMLExportOptions>) => {
      setIsGenerating(true);
      setError(null);
      setProgress({ step: "Building HTML…", percent: 40 });
      try {
        const { generateHTML } = await import("@/services/export/htmlGenerator");
        const html = generateHTML(charter, options);
        setProgress({ step: "Preparing download…", percent: 90 });
        const blob = new Blob([html], { type: "text/html" });
        const filename = `${sanitizeFilename(charter.basics.projectName)}-charter.html`;
        downloadBlob(blob, filename);
        setProgress({ step: "Done", percent: 100 });
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsGenerating(false);
        setTimeout(() => setProgress(null), 1500);
      }
    },
    [charter],
  );

  return { exportPDF, exportHTML, isGenerating, progress, error };
}
