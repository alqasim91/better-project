import { useState } from "react";
import { FileDown, Eye, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CompletenessChecker } from "@/components/validation/CompletenessChecker";
import { MissingFieldsAlert } from "@/components/validation/MissingFieldsAlert";
import { CharterPreview } from "@/components/charter/CharterPreview";
import { ExportModal } from "@/components/export/ExportModal";
import { useCompletenessValidation } from "@/hooks/useValidation";

/**
 * Pre-export screen: shows completeness status, a collapsible full charter
 * preview, and a gated "Export" button that only enables once all critical
 * fields are present.
 */
export function FinalReview() {
  const { isExportReady } = useCompletenessValidation();
  const [exportOpen, setExportOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(true);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-bold tracking-tight">Final Review</h2>
        <p className="text-sm text-muted-foreground">
          Check completeness and preview your charter before exporting.
        </p>
      </div>

      <MissingFieldsAlert />

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Completeness</CardTitle>
          </CardHeader>
          <CardContent>
            <CompletenessChecker />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <button
                type="button"
                className="flex w-full items-center justify-between"
                onClick={() => setPreviewOpen(!previewOpen)}
              >
                <CardTitle className="flex items-center gap-2 text-base">
                  <Eye className="h-4 w-4" /> Charter Preview
                </CardTitle>
                {previewOpen ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </CardHeader>
            {previewOpen && (
              <CardContent>
                <CharterPreview />
              </CardContent>
            )}
          </Card>

          <div className="flex justify-end">
            <Button
              size="lg"
              onClick={() => setExportOpen(true)}
              disabled={!isExportReady}
            >
              <FileDown className="h-5 w-5" />
              {isExportReady ? "Proceed to Export" : "Complete required fields to export"}
            </Button>
          </div>
        </div>
      </div>

      <ExportModal open={exportOpen} onOpenChange={setExportOpen} />
    </div>
  );
}
