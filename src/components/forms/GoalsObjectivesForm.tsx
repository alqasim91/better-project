import { v4 as uuid } from "uuid";
import { Trash2, Plus } from "lucide-react";
import { useCharterStore } from "@/stores/charterStore";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ListField } from "@/components/forms/fields/ListField";
import type { Objective, Priority } from "@/types/charter";

const PRIORITIES: Priority[] = ["low", "medium", "high", "critical"];

/** Section 2 — vision, business case, measurable objectives, success criteria. */
export function GoalsObjectivesForm() {
  const goals = useCharterStore((s) => s.charter.goals);
  const updateSection = useCharterStore((s) => s.updateSection);

  const set = (patch: Partial<typeof goals>) =>
    updateSection("goals", { ...goals, ...patch });

  const addObjective = () => {
    const objective: Objective = {
      id: uuid(),
      statement: "",
      metric: "",
      priority: "medium",
    };
    set({ objectives: [...goals.objectives, objective] });
  };

  const updateObjective = (id: string, patch: Partial<Objective>) => {
    set({
      objectives: goals.objectives.map((o) =>
        o.id === id ? { ...o, ...patch } : o,
      ),
    });
  };

  const removeObjective = (id: string) => {
    set({ objectives: goals.objectives.filter((o) => o.id !== id) });
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="visionStatement">Vision statement</Label>
        <Textarea
          id="visionStatement"
          rows={2}
          value={goals.visionStatement}
          placeholder="The future state this project moves us toward."
          onChange={(e) => set({ visionStatement: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="businessCase">Business case</Label>
        <Textarea
          id="businessCase"
          rows={3}
          value={goals.businessCase}
          placeholder="Why this project is worth doing now."
          onChange={(e) => set({ businessCase: e.target.value })}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Objectives</Label>
          <Button type="button" size="sm" variant="secondary" onClick={addObjective}>
            <Plus className="h-4 w-4" /> Add objective
          </Button>
        </div>

        {goals.objectives.length === 0 && (
          <p className="text-sm text-muted-foreground">No objectives yet.</p>
        )}

        <div className="space-y-3">
          {goals.objectives.map((o) => (
            <div key={o.id} className="space-y-2 rounded-md border p-3">
              <div className="flex gap-2">
                <Input
                  value={o.statement}
                  placeholder="Objective statement"
                  onChange={(e) => updateObjective(o.id, { statement: e.target.value })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeObjective(o.id)}
                  aria-label="Remove objective"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Input
                  value={o.metric}
                  placeholder="Success metric"
                  onChange={(e) => updateObjective(o.id, { metric: e.target.value })}
                />
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={o.priority}
                  onChange={(e) =>
                    updateObjective(o.id, { priority: e.target.value as Priority })
                  }
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p[0].toUpperCase() + p.slice(1)} priority
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ListField
        label="Success criteria"
        placeholder="Add a measurable criterion and press Enter"
        values={goals.successCriteria}
        onChange={(successCriteria) => set({ successCriteria })}
      />
    </div>
  );
}
