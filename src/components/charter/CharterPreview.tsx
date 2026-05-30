import { useCharterStore } from "@/stores/charterStore";
import { SECTION_LABELS } from "@/types/charter";
import { formatISODate, formatCurrency } from "@/lib/exportUtils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm">{children}</CardContent>
    </Card>
  );
}

function LabelValue({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <p>{value || "—"}</p>
    </div>
  );
}

/**
 * Read-only summary of the entire charter in a clean card layout. Used as a
 * pre-export review and in the dashboard.
 */
export function CharterPreview() {
  const c = useCharterStore((s) => s.charter);

  return (
    <div className="space-y-4">
      {/* Basics */}
      <SectionCard title={SECTION_LABELS.basics}>
        <div className="grid gap-3 sm:grid-cols-2">
          <LabelValue label="Project Name" value={c.basics.projectName} />
          <LabelValue label="Sponsor" value={c.basics.sponsor} />
          <LabelValue label="Project Manager" value={c.basics.projectManager} />
          <LabelValue
            label="Timeline"
            value={`${formatISODate(c.basics.startDate)} – ${formatISODate(c.basics.targetEndDate)}`}
          />
        </div>
        <div className="mt-3">
          <LabelValue label="Executive Summary" value={c.basics.summary} />
        </div>
      </SectionCard>

      {/* Goals */}
      <SectionCard title={SECTION_LABELS.goals}>
        <LabelValue label="Vision" value={c.goals.visionStatement} />
        <LabelValue label="Business Case" value={c.goals.businessCase} />
        {c.goals.objectives.length > 0 && (
          <div className="mt-2 space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Objectives</span>
            {c.goals.objectives.map((o) => (
              <div key={o.id} className="flex items-center gap-2">
                <span>{o.statement}</span>
                <Badge variant="outline" className="text-[10px]">{o.priority}</Badge>
              </div>
            ))}
          </div>
        )}
        {c.goals.successCriteria.length > 0 && (
          <div className="mt-2">
            <span className="text-xs font-medium text-muted-foreground">Success Criteria</span>
            <ul className="mt-1 list-inside list-disc text-sm">
              {c.goals.successCriteria.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        )}
      </SectionCard>

      {/* Stakeholders */}
      {c.stakeholders.stakeholders.length > 0 && (
        <SectionCard title={SECTION_LABELS.stakeholders}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="pb-2">Name</th>
                  <th className="pb-2">Role</th>
                  <th className="pb-2">Category</th>
                  <th className="pb-2 text-center">Influence</th>
                  <th className="pb-2 text-center">Interest</th>
                </tr>
              </thead>
              <tbody>
                {c.stakeholders.stakeholders.map((s) => (
                  <tr key={s.id} className="border-b last:border-0">
                    <td className="py-1.5">{s.name}</td>
                    <td className="py-1.5">{s.role}</td>
                    <td className="py-1.5">{s.category}</td>
                    <td className="py-1.5 text-center">{s.influence}</td>
                    <td className="py-1.5 text-center">{s.interest}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {/* Scope */}
      <SectionCard title={SECTION_LABELS.scope}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <span className="text-xs font-medium text-muted-foreground">In Scope</span>
            <ul className="mt-1 list-inside list-disc">{c.scope.inScope.map((s, i) => <li key={i}>{s}</li>)}</ul>
          </div>
          <div>
            <span className="text-xs font-medium text-muted-foreground">Out of Scope</span>
            <ul className="mt-1 list-inside list-disc">{c.scope.outOfScope.map((s, i) => <li key={i}>{s}</li>)}</ul>
          </div>
        </div>
      </SectionCard>

      {/* Risks */}
      <SectionCard title={SECTION_LABELS.risks}>
        {c.risks.risks.map((r) => (
          <div key={r.id} className="mb-2 rounded border p-2">
            <p className="font-medium">{r.description}</p>
            <p className="text-xs text-muted-foreground">
              Prob: {r.probability} · Impact: {r.impact} · Mitigation: {r.mitigation}
            </p>
          </div>
        ))}
        {c.risks.assumptions.length > 0 && (
          <div className="mt-2">
            <span className="text-xs font-medium text-muted-foreground">Assumptions</span>
            <ul className="mt-1 list-inside list-disc">{c.risks.assumptions.map((a, i) => <li key={i}>{a}</li>)}</ul>
          </div>
        )}
      </SectionCard>

      {/* Deliverables */}
      <SectionCard title={SECTION_LABELS.deliverables}>
        {c.deliverables.deliverables.map((d) => (
          <div key={d.id} className="mb-2 rounded border p-2">
            <div className="flex items-center justify-between">
              <p className="font-medium">{d.name}</p>
              <span className="text-xs text-muted-foreground">{formatISODate(d.dueDate)}</span>
            </div>
            <p className="text-muted-foreground">{d.description}</p>
          </div>
        ))}
      </SectionCard>

      {/* Timeline & Budget */}
      <SectionCard title={SECTION_LABELS.timeline}>
        {c.timeline.milestones.map((m) => (
          <div key={m.id} className="flex items-center gap-2 py-1">
            <Badge variant="outline" className="text-[10px]">{m.type}</Badge>
            <span>{m.title}</span>
            <span className="ml-auto text-xs text-muted-foreground">{formatISODate(m.date)}</span>
          </div>
        ))}
        <div className="mt-3 border-t pt-3">
          <LabelValue
            label="Budget"
            value={`${formatCurrency(c.timeline.totalBudget, c.timeline.currency)}${c.timeline.budgetNotes ? ` — ${c.timeline.budgetNotes}` : ""}`}
          />
        </div>
      </SectionCard>
    </div>
  );
}
