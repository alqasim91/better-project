import { v4 as uuid } from "uuid";
import { Trash2, Plus } from "lucide-react";
import { useCharterStore } from "@/stores/charterStore";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { InfoHint } from "@/components/ui/InfoHint";
import type { Milestone, MilestoneType } from "@/types/charter";

const MILESTONE_TYPES: MilestoneType[] = ["milestone", "deliverable", "review"];

/** Section 7 — milestone schedule plus headline budget. */
export function TimelineBudgetForm() {
  const timeline = useCharterStore((s) => s.charter.timeline);
  const updateSection = useCharterStore((s) => s.updateSection);

  const set = (patch: Partial<typeof timeline>) =>
    updateSection("timeline", { ...timeline, ...patch });

  const addMilestone = () => {
    const milestone: Milestone = {
      id: uuid(),
      title: "",
      date: "",
      type: "milestone",
    };
    set({ milestones: [...timeline.milestones, milestone] });
  };

  const updateMilestone = (id: string, patch: Partial<Milestone>) =>
    set({
      milestones: timeline.milestones.map((m) =>
        m.id === id ? { ...m, ...patch } : m,
      ),
    });

  const removeMilestone = (id: string) =>
    set({ milestones: timeline.milestones.filter((m) => m.id !== id) });

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label>Milestones</Label>
            <InfoHint label="A milestone is a checkpoint in time marking progress (e.g., 'Beta launch', 'Regulatory approval'). Different from a deliverable, which is a tangible output. A milestone often marks when one or more deliverables are complete." />
          </div>
          <Button type="button" size="sm" variant="secondary" onClick={addMilestone}>
            <Plus className="h-4 w-4" /> Add milestone
          </Button>
        </div>

        {timeline.milestones.length === 0 && (
          <p className="text-sm text-muted-foreground">No milestones yet.</p>
        )}

        <div className="space-y-2">
          {timeline.milestones.map((m) => (
            <div key={m.id} className="flex gap-2">
              <Input
                value={m.title}
                placeholder="Milestone title"
                onChange={(e) => updateMilestone(m.id, { title: e.target.value })}
              />
              <Input
                type="date"
                value={m.date}
                onChange={(e) => updateMilestone(m.id, { date: e.target.value })}
              />
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={m.type}
                onChange={(e) =>
                  updateMilestone(m.id, { type: e.target.value as MilestoneType })
                }
              >
                {MILESTONE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t[0].toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeMilestone(m.id)}
                aria-label="Remove milestone"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="totalBudget">Total budget</Label>
          <Input
            id="totalBudget"
            type="number"
            min={0}
            value={timeline.totalBudget}
            onChange={(e) => set({ totalBudget: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Input
            id="currency"
            value={timeline.currency}
            placeholder="USD"
            onChange={(e) => set({ currency: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="budgetNotes">Budget notes</Label>
        <Textarea
          id="budgetNotes"
          rows={3}
          value={timeline.budgetNotes}
          placeholder="Assumptions, contingencies, or breakdown notes."
          onChange={(e) => set({ budgetNotes: e.target.value })}
        />
      </div>
    </div>
  );
}
