import { useState } from "react";
import { FileDown, FileText, Globe, Loader2, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useExport } from "@/hooks/useExport";
import { ExportOptions } from "@/components/export/ExportOptions";
import type { HTMLExportOptions } from "@/hooks/useExport";

type ExportTab = "pdf" | "html";

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Export dialog with tabs for PDF and interactive HTML. PDF is a straight
 * download; HTML has checkboxes controlling included sections.
 */
export function ExportModal({ open, onOpenChange }: ExportModalProps) {
  const [tab, setTab] = useState<ExportTab>("pdf");
  const { exportPDF, exportHTML, isGenerating, progress, error } = useExport();

  const [htmlOptions, setHtmlOptions] = useState<HTMLExportOptions>({
    includeTimeline: true,
    includeStakeholderMap: true,
    includeBudgetDetails: true,
  });

  const handleExport = async () => {
    if (tab === "pdf") {
      await exportPDF();
    } else {
      await exportHTML(htmlOptions);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileDown className="h-5 w-5 text-primary" />
            Export Charter
          </DialogTitle>
          <DialogDescription>
            Download your charter as a polished PDF or an interactive HTML page.
          </DialogDescription>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          <button
            type="button"
            onClick={() => setTab("pdf")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              tab === "pdf" ? "bg-background shadow-sm" : "hover:bg-background/50"
            }`}
          >
            <FileText className="h-4 w-4" /> PDF Document
          </button>
          <button
            type="button"
            onClick={() => setTab("html")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              tab === "html" ? "bg-background shadow-sm" : "hover:bg-background/50"
            }`}
          >
            <Globe className="h-4 w-4" /> Interactive HTML
          </button>
        </div>

        {/* Tab content */}
        <div className="space-y-4 py-2">
          {tab === "pdf" ? (
            <p className="text-sm text-muted-foreground">
              Generates a print-ready A4 PDF with all charter sections, header,
              footer, and page numbers. Great for stakeholder sign-off.
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Generates a standalone HTML file with an embedded interactive
                timeline. Open in any browser — no server required.
              </p>
              <ExportOptions options={htmlOptions} onChange={setHtmlOptions} />
            </>
          )}

          {progress && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {progress.step}
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Exporting…
              </>
            ) : (
              <>
                <FileDown className="h-4 w-4" />{" "}
                {tab === "pdf" ? "Download PDF" : "Download HTML"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
