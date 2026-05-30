import { Label } from "@/components/ui/label";
import type { HTMLExportOptions } from "@/services/export/htmlGenerator";

interface ExportOptionsProps {
  options: HTMLExportOptions;
  onChange: (options: HTMLExportOptions) => void;
}

const OPTION_ITEMS: { key: keyof HTMLExportOptions; label: string }[] = [
  { key: "includeTimeline", label: "Interactive timeline" },
  { key: "includeStakeholderMap", label: "Stakeholder table" },
  { key: "includeBudgetDetails", label: "Budget details" },
];

/** Checkboxes controlling what's included in the HTML export. */
export function ExportOptions({ options, onChange }: ExportOptionsProps) {
  return (
    <div className="space-y-2">
      <Label className="text-xs">Include in export</Label>
      {OPTION_ITEMS.map(({ key, label }) => (
        <label key={key} className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={options[key]}
            onChange={(e) => onChange({ ...options, [key]: e.target.checked })}
            className="rounded border-input"
          />
          {label}
        </label>
      ))}
    </div>
  );
}
