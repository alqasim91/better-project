import type { Charter } from "@/types/charter";
import { SECTION_LABELS } from "@/types/charter";
import { formatISODate, formatCurrency } from "@/lib/exportUtils";
// Import vis-timeline assets as raw strings so the export is fully self-contained
// (no CDN dependency — works offline / from file://).
import visTimelineJs from "@/assets/vis-timeline/vis-timeline.min.js?raw";
import visTimelineCss from "@/assets/vis-timeline/vis-timeline.min.css?raw";

export interface HTMLExportOptions {
  includeTimeline: boolean;
  includeStakeholderMap: boolean;
  includeBudgetDetails: boolean;
}

const DEFAULT_OPTIONS: HTMLExportOptions = {
  includeTimeline: true,
  includeStakeholderMap: true,
  includeBudgetDetails: true,
};

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function listItems(items: string[]): string {
  return items.map((i) => `<li>${esc(i)}</li>`).join("\n");
}

/**
 * Generate a complete standalone HTML document for the charter. Includes an
 * embedded vis-timeline (loaded from CDN) and a stakeholder table. Can be
 * opened in any browser without a server.
 */
export function generateHTML(
  charter: Charter,
  options: Partial<HTMLExportOptions> = {},
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const name = charter.basics.projectName || "Project Charter";

  // Build stakeholder rows.
  const stakeholderRows = charter.stakeholders.stakeholders
    .map(
      (s) =>
        `<tr><td>${esc(s.name)}</td><td>${esc(s.role)}</td><td>${esc(s.category)}</td><td>${s.influence}</td><td>${s.interest}</td></tr>`,
    )
    .join("\n");

  // Build timeline items JSON for the embedded vis-timeline.
  const timelineItems = charter.timeline.milestones
    .filter((m) => m.date)
    .map((m) => ({
      id: m.id,
      content: m.title || "Untitled",
      start: m.date,
      className: `type-${m.type}`,
      type: "box",
    }));

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${esc(name)}</title>
${opts.includeTimeline ? `<style>${visTimelineCss}</style>
<script>${visTimelineJs}<\/script>` : ""}
<style>
  :root { --primary: #4f46e5; --bg: #f8fafc; --text: #0f172a; --muted: #64748b; --border: #e2e8f0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: system-ui, -apple-system, sans-serif; background: var(--bg); color: var(--text); line-height: 1.6; padding: 32px; max-width: 900px; margin: 0 auto; }
  h1 { color: var(--primary); font-size: 1.75rem; margin-bottom: 4px; }
  h2 { color: var(--primary); font-size: 1.15rem; margin: 24px 0 8px; padding-bottom: 4px; border-bottom: 2px solid var(--primary); }
  .meta { color: var(--muted); font-size: 0.85rem; margin-bottom: 24px; }
  .label { font-size: 0.8rem; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; margin-top: 12px; }
  p, li { font-size: 0.95rem; }
  ul { padding-left: 20px; margin: 4px 0 12px; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0 16px; font-size: 0.9rem; }
  th, td { padding: 6px 10px; border: 1px solid var(--border); text-align: left; }
  th { background: var(--primary); color: #fff; font-weight: 600; font-size: 0.8rem; }
  .risk { background: #fff; border: 1px solid var(--border); border-radius: 6px; padding: 10px; margin-bottom: 8px; }
  .risk-meta { font-size: 0.8rem; color: var(--muted); }
  #timeline { border: 1px solid var(--border); border-radius: 8px; margin: 12px 0; }
  .type-milestone { background: #6366f1; color: #fff; border-color: #4f46e5; }
  .type-deliverable { background: #10b981; color: #fff; border-color: #059669; }
  .type-review { background: #f59e0b; color: #fff; border-color: #d97706; }
  .milestone-list { list-style: none; padding: 0; margin: 8px 0 16px; }
  .milestone-list li { padding: 6px 0; border-bottom: 1px solid var(--border); font-size: 0.9rem; }
  .milestone-list li:last-child { border-bottom: none; }
  .ml-dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 8px; vertical-align: middle; }
  .ml-dot.milestone { background: #6366f1; }
  .ml-dot.deliverable { background: #10b981; }
  .ml-dot.review { background: #f59e0b; }
  .ml-date { color: var(--muted); font-size: 0.8rem; margin-left: 8px; }
  /* Interactive timeline visible on screen, static list visible in print */
  .timeline-static { display: none; }
  @media print { body { padding: 16px; } h1 { font-size: 1.3rem; } #timeline { display: none; } .timeline-static { display: block; } }
</style>
</head>
<body>

<h1>${esc(name)}</h1>
<div class="meta">
  Sponsor: ${esc(charter.basics.sponsor || "—")} &bull;
  PM: ${esc(charter.basics.projectManager || "—")} &bull;
  ${formatISODate(charter.basics.startDate)} – ${formatISODate(charter.basics.targetEndDate)}
</div>

<h2>${esc(SECTION_LABELS.basics)}</h2>
<p>${esc(charter.basics.summary)}</p>

<h2>${esc(SECTION_LABELS.goals)}</h2>
<div class="label">Vision</div>
<p>${esc(charter.goals.visionStatement)}</p>
<div class="label">Business Case</div>
<p>${esc(charter.goals.businessCase)}</p>
${charter.goals.objectives.length > 0 ? `
<div class="label">Objectives</div>
<ul>${charter.goals.objectives.map((o) => `<li><strong>${esc(o.statement)}</strong> — Metric: ${esc(o.metric)} (${o.priority})</li>`).join("\n")}</ul>` : ""}
${charter.goals.successCriteria.length > 0 ? `
<div class="label">Success Criteria</div>
<ul>${listItems(charter.goals.successCriteria)}</ul>` : ""}

${opts.includeStakeholderMap && charter.stakeholders.stakeholders.length > 0 ? `
<h2>${esc(SECTION_LABELS.stakeholders)}</h2>
<table>
<tr><th>Name</th><th>Role</th><th>Category</th><th>Influence</th><th>Interest</th></tr>
${stakeholderRows}
</table>` : ""}

<h2>${esc(SECTION_LABELS.scope)}</h2>
${charter.scope.inScope.length > 0 ? `<div class="label">In Scope</div><ul>${listItems(charter.scope.inScope)}</ul>` : ""}
${charter.scope.outOfScope.length > 0 ? `<div class="label">Out of Scope</div><ul>${listItems(charter.scope.outOfScope)}</ul>` : ""}
${charter.scope.constraints.length > 0 ? `<div class="label">Constraints</div><ul>${charter.scope.constraints.map((c) => `<li>[${esc(c.type)}] ${esc(c.description)}</li>`).join("\n")}</ul>` : ""}

<h2>${esc(SECTION_LABELS.risks)}</h2>
${charter.risks.risks.map((r) => `
<div class="risk">
  <strong>${esc(r.description)}</strong>
  <div class="risk-meta">Probability: ${r.probability} &bull; Impact: ${r.impact} &bull; Mitigation: ${esc(r.mitigation)}</div>
</div>`).join("\n")}
${charter.risks.assumptions.length > 0 ? `<div class="label">Assumptions</div><ul>${listItems(charter.risks.assumptions)}</ul>` : ""}
${charter.risks.dependencies.length > 0 ? `<div class="label">Dependencies</div><ul>${listItems(charter.risks.dependencies)}</ul>` : ""}

<h2>${esc(SECTION_LABELS.deliverables)}</h2>
${charter.deliverables.deliverables.map((d) => `
<div class="risk">
  <strong>${esc(d.name)}</strong> <span class="risk-meta">Due: ${formatISODate(d.dueDate)}</span>
  <p>${esc(d.description)}</p>
  <div class="risk-meta">Acceptance: ${esc(d.acceptanceCriteria)}</div>
</div>`).join("\n")}

<h2>${esc(SECTION_LABELS.timeline)}</h2>
${opts.includeTimeline && timelineItems.length > 0 ? `
<div id="timeline"></div>
<script>
var items = new vis.DataSet(${JSON.stringify(timelineItems)});
new vis.Timeline(document.getElementById("timeline"), items, { height: "300px", margin: { item: 10 } }).fit();
<\/script>` : ""}
${charter.timeline.milestones.length > 0 ? `
<ul class="milestone-list${opts.includeTimeline && timelineItems.length > 0 ? " timeline-static" : ""}">
${charter.timeline.milestones.map((m) => `<li><span class="ml-dot ${m.type}"></span><strong>${esc(m.title)}</strong><span class="ml-date">${formatISODate(m.date)} · ${m.type}</span></li>`).join("\n")}
</ul>` : "<p>No milestones defined.</p>"}

${opts.includeBudgetDetails ? `
<div class="label">Budget</div>
<p>${formatCurrency(charter.timeline.totalBudget, charter.timeline.currency)}${charter.timeline.budgetNotes ? ` — ${esc(charter.timeline.budgetNotes)}` : ""}</p>` : ""}

<hr style="margin-top:32px;border:none;border-top:1px solid var(--border)">
<p style="font-size:0.75rem;color:var(--muted);margin-top:8px;">Generated by Better Project on ${formatISODate(new Date().toISOString())}</p>

</body>
</html>`;
}
