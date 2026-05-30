import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ListFieldProps {
  label: string;
  placeholder?: string;
  values: string[];
  onChange: (values: string[]) => void;
  /** Optional helper text shown under the label. */
  hint?: string;
}

/**
 * Reusable editor for an array of free-text strings (success criteria,
 * in-scope items, assumptions, etc.). Used across several charter forms.
 */
export function ListField({
  label,
  placeholder,
  values,
  onChange,
  hint,
}: ListFieldProps) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onChange([...values, trimmed]);
    setDraft("");
  };

  const remove = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}

      <div className="flex gap-2">
        <Input
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <Button type="button" variant="secondary" onClick={add}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {values.length > 0 && (
        <ul className="space-y-2">
          {values.map((value, index) => (
            <li
              key={`${value}-${index}`}
              className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2 text-sm"
            >
              <span className="break-words pr-2">{value}</span>
              <button
                type="button"
                onClick={() => remove(index)}
                className="text-muted-foreground hover:text-destructive"
                aria-label={`Remove ${value}`}
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
