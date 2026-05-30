import { v4 as uuid } from "uuid";
import { Trash2, Plus } from "lucide-react";
import { useCharterStore } from "@/stores/charterStore";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ListField } from "@/components/forms/fields/ListField";
import type { Risk, Priority } from "@/types/charter";

const PRIORITIES: Priority[] = ["low", "medium", "high", "critical"];

/** Section 5 — risk register plus assumptions and external dependencies. */
export function RiskAssumptionsForm() {
  const risks = useCharterStore((s) => s.charter.risks);
  const updateSection = useCharterStore((s) => s.updateSection);

  const set = (patch: Partial<typeof risks>) =>
    updateSection("risks", { ...risks, ...patch });

  const addRisk = () => {
    const risk: Risk = {
      id: uuid(),
      description: "",
      probability: "medium",
      impact: "medium",
      mitigation: "",
    };
    set({ risks: [...risks.risks, risk] });
  };

  const updateRisk = (id: string, patch: Partial<Risk>) =>
    set({ risks: risks.risks.map((r) => (r.id === id ? { ...r, ...patch } : r)) });

  const removeRisk = (id: string) =>
    set({ risks: risks.risks.filter((r) => r.id !== id) });

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Risk register</Label>
          <Button type="button" size="sm" variant="secondary" onClick={addRisk}>
            <Plus className="h-4 w-4" /> Add risk
          </Button>
        </div>

        {risks.risks.length === 0 && (
          <p className="text-sm text-muted-foreground">No risks logged yet.</p>
        )}

        <div className="space-y-3">
          {risks.risks.map((r) => (
            <div key={r.id} className="space-y-2 rounded-md border p-3">
              <div className="flex gap-2">
                <Input
                  value={r.description}
                  placeholder="Risk description"
                  onChange={(e) => updateRisk(r.id, { description: e.target.value })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeRisk(r.id)}
                  aria-label="Remove risk"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={r.probability}
                  onChange={(e) =>
                    updateRisk(r.id, { probability: e.target.value as Priority })
                  }
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      Prob: {p}
                    </option>
                  ))}
                </select>
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={r.impact}
                  onChange={(e) =>
                    updateRisk(r.id, { impact: e.target.value as Priority })
                  }
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      Impact: {p}
                    </option>
                  ))}
                </select>
                <Input
                  value={r.mitigation}
                  placeholder="Mitigation"
                  onChange={(e) => updateRisk(r.id, { mitigation: e.target.value })}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <ListField
          label="Assumptions"
          placeholder="Add an assumption"
          values={risks.assumptions}
          onChange={(assumptions) => set({ assumptions })}
        />
        <ListField
          label="Dependencies"
          placeholder="Add a dependency"
          values={risks.dependencies}
          onChange={(dependencies) => set({ dependencies })}
        />
      </div>
    </div>
  );
}
