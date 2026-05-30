import { FileX, AlertTriangle } from "lucide-react";

/** Shown when the user tries to export but has no data. */
export function NoDataForExport() {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <FileX className="h-6 w-6 text-muted-foreground" />
      </div>
      <div>
        <p className="font-medium">Nothing to export</p>
        <p className="text-sm text-muted-foreground">
          Fill in your charter sections first, then come back to export.
        </p>
      </div>
    </div>
  );
}

/** Shown when export encounters an error. */
export function ExportError({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-6 w-6 text-destructive" />
      </div>
      <div>
        <p className="font-medium">Export failed</p>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
