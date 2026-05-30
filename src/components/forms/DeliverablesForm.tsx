import { v4 as uuid } from "uuid";
import { Trash2, Plus } from "lucide-react";
import { useCharterStore } from "@/stores/charterStore";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { Deliverable } from "@/types/charter";

/** Section 6 — concrete outputs with acceptance criteria and due dates. */
export function DeliverablesForm() {
  const { deliverables } = useCharterStore((s) => s.charter.deliverables);
  const updateSection = useCharterStore((s) => s.updateSection);

  const setAll = (next: Deliverable[]) =>
    updateSection("deliverables", { deliverables: next });

  const add = () => {
    const deliverable: Deliverable = {
      id: uuid(),
      name: "",
      description: "",
      acceptanceCriteria: "",
      dueDate: "",
    };
    setAll([...deliverables, deliverable]);
  };

  const update = (id: string, patch: Partial<Deliverable>) =>
    setAll(deliverables.map((d) => (d.id === id ? { ...d, ...patch } : d)));

  const remove = (id: string) => setAll(deliverables.filter((d) => d.id !== id));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Define each tangible output and how it will be accepted.
        </p>
        <Button type="button" size="sm" variant="secondary" onClick={add}>
          <Plus className="h-4 w-4" /> Add deliverable
        </Button>
      </div>

      {deliverables.length === 0 && (
        <p className="text-sm text-muted-foreground">No deliverables yet.</p>
      )}

      <div className="space-y-3">
        {deliverables.map((d) => (
          <div key={d.id} className="space-y-2 rounded-md border p-3">
            <div className="flex gap-2">
              <Input
                value={d.name}
                placeholder="Deliverable name"
                onChange={(e) => update(d.id, { name: e.target.value })}
              />
              <div className="space-y-1">
                <Input
                  type="date"
                  value={d.dueDate}
                  onChange={(e) => update(d.id, { dueDate: e.target.value })}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(d.id)}
                aria-label="Remove deliverable"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <Textarea
              rows={2}
              value={d.description}
              placeholder="Description"
              onChange={(e) => update(d.id, { description: e.target.value })}
            />
            <div className="space-y-1">
              <Label className="text-xs">Acceptance criteria</Label>
              <Textarea
                rows={2}
                value={d.acceptanceCriteria}
                placeholder="How we'll know this is done and acceptable."
                onChange={(e) => update(d.id, { acceptanceCriteria: e.target.value })}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
