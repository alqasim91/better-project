import { v4 as uuid } from "uuid";
import { Trash2, Plus } from "lucide-react";
import { useCharterStore } from "@/stores/charterStore";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ListField } from "@/components/forms/fields/ListField";
import type { Constraint } from "@/types/charter";

const CONSTRAINT_TYPES: Constraint["type"][] = [
  "budget",
  "time",
  "resource",
  "technical",
  "regulatory",
];

/** Section 4 — what's in/out of scope and the constraints that bound it. */
export function ScopeConstraintsForm() {
  const scope = useCharterStore((s) => s.charter.scope);
  const updateSection = useCharterStore((s) => s.updateSection);

  const set = (patch: Partial<typeof scope>) =>
    updateSection("scope", { ...scope, ...patch });

  const addConstraint = () => {
    const constraint: Constraint = { id: uuid(), description: "", type: "budget" };
    set({ constraints: [...scope.constraints, constraint] });
  };

  const updateConstraint = (id: string, patch: Partial<Constraint>) =>
    set({
      constraints: scope.constraints.map((c) =>
        c.id === id ? { ...c, ...patch } : c,
      ),
    });

  const removeConstraint = (id: string) =>
    set({ constraints: scope.constraints.filter((c) => c.id !== id) });

  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <ListField
          label="In scope"
          placeholder="Add an in-scope item"
          values={scope.inScope}
          onChange={(inScope) => set({ inScope })}
        />
        <ListField
          label="Out of scope"
          placeholder="Add an out-of-scope item"
          values={scope.outOfScope}
          onChange={(outOfScope) => set({ outOfScope })}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Constraints</Label>
          <Button type="button" size="sm" variant="secondary" onClick={addConstraint}>
            <Plus className="h-4 w-4" /> Add constraint
          </Button>
        </div>

        {scope.constraints.length === 0 && (
          <p className="text-sm text-muted-foreground">No constraints yet.</p>
        )}

        <div className="space-y-2">
          {scope.constraints.map((c) => (
            <div key={c.id} className="flex gap-2">
              <Input
                value={c.description}
                placeholder="Constraint description"
                onChange={(e) => updateConstraint(c.id, { description: e.target.value })}
              />
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={c.type}
                onChange={(e) =>
                  updateConstraint(c.id, { type: e.target.value as Constraint["type"] })
                }
              >
                {CONSTRAINT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t[0].toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeConstraint(c.id)}
                aria-label="Remove constraint"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
