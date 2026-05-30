import { v4 as uuid } from "uuid";
import { Trash2, Plus } from "lucide-react";
import { useCharterStore } from "@/stores/charterStore";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { Stakeholder, StakeholderCategory } from "@/types/charter";

const CATEGORIES: StakeholderCategory[] = ["internal", "external", "regulatory"];
const SCALE = [1, 2, 3, 4, 5] as const;

/** Section 3 — people with a stake, scored on influence and interest. */
export function StakeholdersForm() {
  const { stakeholders } = useCharterStore((s) => s.charter.stakeholders);
  const updateSection = useCharterStore((s) => s.updateSection);

  const setAll = (next: Stakeholder[]) =>
    updateSection("stakeholders", { stakeholders: next });

  const add = () => {
    const stakeholder: Stakeholder = {
      id: uuid(),
      name: "",
      role: "",
      category: "internal",
      influence: 3,
      interest: 3,
    };
    setAll([...stakeholders, stakeholder]);
  };

  const update = (id: string, patch: Partial<Stakeholder>) =>
    setAll(stakeholders.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const remove = (id: string) => setAll(stakeholders.filter((s) => s.id !== id));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Score influence and interest (1–5) to drive the power/interest map.
        </p>
        <Button type="button" size="sm" variant="secondary" onClick={add}>
          <Plus className="h-4 w-4" /> Add stakeholder
        </Button>
      </div>

      {stakeholders.length === 0 && (
        <p className="text-sm text-muted-foreground">No stakeholders yet.</p>
      )}

      <div className="space-y-3">
        {stakeholders.map((s) => (
          <div key={s.id} className="space-y-3 rounded-md border p-3">
            <div className="flex gap-2">
              <Input
                value={s.name}
                placeholder="Name"
                onChange={(e) => update(s.id, { name: e.target.value })}
              />
              <Input
                value={s.role}
                placeholder="Role"
                onChange={(e) => update(s.id, { role: e.target.value })}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(s.id)}
                aria-label="Remove stakeholder"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label className="text-xs">Category</Label>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={s.category}
                  onChange={(e) =>
                    update(s.id, { category: e.target.value as StakeholderCategory })
                  }
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c[0].toUpperCase() + c.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Influence</Label>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={s.influence}
                  onChange={(e) =>
                    update(s.id, {
                      influence: Number(e.target.value) as Stakeholder["influence"],
                    })
                  }
                >
                  {SCALE.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Interest</Label>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={s.interest}
                  onChange={(e) =>
                    update(s.id, {
                      interest: Number(e.target.value) as Stakeholder["interest"],
                    })
                  }
                >
                  {SCALE.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
