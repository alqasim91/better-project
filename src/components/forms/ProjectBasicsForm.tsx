import { useCharterStore } from "@/stores/charterStore";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/** Section 1 — high-level identity and timeframe of the project. */
export function ProjectBasicsForm() {
  const basics = useCharterStore((s) => s.charter.basics);
  const updateSection = useCharterStore((s) => s.updateSection);

  const set = (patch: Partial<typeof basics>) =>
    updateSection("basics", { ...basics, ...patch });

  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="projectName">Project name</Label>
          <Input
            id="projectName"
            value={basics.projectName}
            placeholder="e.g. Customer Portal Redesign"
            onChange={(e) => set({ projectName: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sponsor">Sponsor</Label>
          <Input
            id="sponsor"
            value={basics.sponsor}
            placeholder="Executive sponsor"
            onChange={(e) => set({ sponsor: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="projectManager">Project manager</Label>
          <Input
            id="projectManager"
            value={basics.projectManager}
            placeholder="Accountable PM"
            onChange={(e) => set({ projectManager: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="startDate">Start date</Label>
          <Input
            id="startDate"
            type="date"
            value={basics.startDate}
            onChange={(e) => set({ startDate: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="targetEndDate">Target end date</Label>
          <Input
            id="targetEndDate"
            type="date"
            value={basics.targetEndDate}
            onChange={(e) => set({ targetEndDate: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="summary">Executive summary</Label>
        <Textarea
          id="summary"
          rows={4}
          value={basics.summary}
          placeholder="One paragraph describing what this project will achieve and why."
          onChange={(e) => set({ summary: e.target.value })}
        />
      </div>
    </div>
  );
}
