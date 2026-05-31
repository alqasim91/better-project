import { useCharterStore } from "@/stores/charterStore";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { InfoHint } from "@/components/ui/InfoHint";

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
        <div className="flex items-center gap-1">
          <Label htmlFor="summary">Executive summary</Label>
          <InfoHint label="The short overview a busy exec reads first — what the project is and why it matters, in plain terms. Example: 'Redesign the customer portal to cut support tickets and improve self-service.' (The Vision and Business case in the next step go deeper.)" />
        </div>
        <Textarea
          id="summary"
          rows={4}
          value={basics.summary}
          placeholder="One paragraph: what this project will achieve and why it matters."
          onChange={(e) => set({ summary: e.target.value })}
        />
      </div>
    </div>
  );
}
