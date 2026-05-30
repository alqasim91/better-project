import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TimelineMilestone, TimelineItemType } from "@/types/timeline";
import type { Milestone } from "@/types/charter";

const TYPES: TimelineItemType[] = ["milestone", "deliverable", "review"];

interface TimelineEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingId: string | null;
  milestones: TimelineMilestone[];
  onAdd: (data: { title: string; date: string; type: TimelineItemType; owner?: string }) => void;
  onUpdate: (id: string, patch: Partial<Milestone>) => void;
  onRemove: (id: string) => void;
}

/**
 * Modal form for creating or editing a milestone. When editing, pre-fills
 * fields from the existing milestone.
 */
export function TimelineEditor({
  open,
  onOpenChange,
  editingId,
  milestones,
  onAdd,
  onUpdate,
  onRemove,
}: TimelineEditorProps) {
  const existing = editingId ? milestones.find((m) => m.id === editingId) : null;

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState<TimelineItemType>("milestone");
  const [owner, setOwner] = useState("");

  useEffect(() => {
    if (existing) {
      setTitle(existing.title);
      setDate(existing.date);
      setType(existing.type);
      setOwner(existing.owner ?? "");
    } else {
      setTitle("");
      setDate("");
      setType("milestone");
      setOwner("");
    }
  }, [existing, open]);

  const handleSave = () => {
    if (!title.trim() || !date) return;
    if (existing) {
      onUpdate(existing.id, {
        title: title.trim(),
        date,
        type,
        owner: owner.trim() || undefined,
      });
    } else {
      onAdd({
        title: title.trim(),
        date,
        type,
        owner: owner.trim() || undefined,
      });
    }
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (existing) {
      onRemove(existing.id);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>{existing ? "Edit milestone" : "Add milestone"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ms-title">Title</Label>
            <Input
              id="ms-title"
              value={title}
              placeholder="Sprint 1 Complete"
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ms-date">Date</Label>
              <Input
                id="ms-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ms-type">Type</Label>
              <select
                id="ms-type"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={type}
                onChange={(e) => setType(e.target.value as TimelineItemType)}
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t[0].toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ms-owner">Owner (optional)</Label>
            <Input
              id="ms-owner"
              value={owner}
              placeholder="Responsible person"
              onChange={(e) => setOwner(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          {existing && (
            <Button variant="destructive" onClick={handleDelete} className="mr-auto">
              Delete
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!title.trim() || !date}>
            {existing ? "Save" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
