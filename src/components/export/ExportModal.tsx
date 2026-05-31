import { useState } from "react";
import { FileDown, FileText, Globe, Loader2, AlertCircle, Check } from "lucide-react";
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
            Pick a format. You can always come back and export the other one.
          </DialogDescription>
        </DialogHeader>

        {/* Format choice — stacked cards, PDF is the recommended default. */}
        <div className="space-y-2">
          <FormatCard
            selected={tab === "pdf"}
            onSelect={() => setTab("pdf")}
            icon={<FileText className="h-5 w-5" />}
            title="PDF document"
            badge="Recommended"
            description="A clean, print-ready file for sharing and sign-off."
          />
          <FormatCard
            selected={tab === "html"}
            onSelect={() => setTab("html")}
            icon={<Globe className="h-5 w-5" />}
            title="Web page"
            description="An interactive page with a live timeline. Opens in any browser."
          />
        </div>

        {/* Format-specific extras */}
        <div className="space-y-4 py-1">
          {tab === "html" && (
            <details className="rounded-md border bg-muted/30 p-3 text-sm">
              <summary className="cursor-pointer select-none font-medium">
                What to include
              </summary>
              <div className="pt-3">
                <ExportOptions options={htmlOptions} onChange={setHtmlOptions} />
              </div>
            </details>
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

interface FormatCardProps {
  selected: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
}

/** A selectable format row in the export dialog. */
function FormatCard({
  selected,
  onSelect,
  icon,
  title,
  description,
  badge,
}: FormatCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
        selected ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-accent"
      }`}
    >
      <span className="mt-0.5 text-primary">{icon}</span>
      <span className="flex-1">
        <span className="flex items-center gap-2">
          <span className="text-sm font-medium">{title}</span>
          {badge && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
              {badge}
            </span>
          )}
        </span>
        <span className="mt-0.5 block text-xs text-muted-foreground">
          {description}
        </span>
      </span>
      {selected && <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />}
    </button>
  );
}
