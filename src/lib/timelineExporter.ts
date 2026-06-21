import type { TimelineMilestone } from "@/types/timeline";
// Import vis-timeline assets as raw strings — fully self-contained, no CDN.
import visTimelineJs from "@/assets/vis-timeline/vis-timeline.min.js?raw";
import visTimelineCss from "@/assets/vis-timeline/vis-timeline.min.css?raw";

/**
 * Generate a standalone HTML file with an embedded vis-timeline inlined
 * directly into the document. Fully self-contained — works offline and from
 * file:// with no CDN dependency.
 */
export function exportTimelineToHTML(
  milestones: TimelineMilestone[],
  projectName: string,
): string {
  const dated = milestones.filter((m) => m.date);
  const items = dated.map((m) => ({
    id: m.id,
    content: m.title || "Untitled",
    start: m.date,
    className: `type-${m.type} status-${m.status}`,
    type: "box" as const,
  }));

  // Static fallback list — always present for print and JS-fail resilience.
  const staticList = dated.length > 0
    ? `<ul class="milestone-list">${dated.map((m) => `<li><span class="ml-dot ${m.type}"></span><strong>${escapeHtml(m.title || "Untitled")}</strong><span class="ml-date">${m.date} · ${m.type}</span></li>`).join("\n")}</ul>`
    : "<p>No milestones defined.</p>";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${escapeHtml(projectName)} — Timeline</title>
<style>${visTimelineCss}</style>
<script>${visTimelineJs}<\/script>
<style>
  body { font-family: system-ui, sans-serif; margin: 0; padding: 20px; background: #fafafa; }
  h1 { font-size: 1.25rem; margin-bottom: 16px; }
  #timeline { border: 1px solid #e2e8f0; border-radius: 8px; background: #fff; }
  .type-milestone { background: #6366f1; color: #fff; border-color: #4f46e5; }
  .type-deliverable { background: #10b981; color: #fff; border-color: #059669; }
  .type-review { background: #f59e0b; color: #fff; border-color: #d97706; }
  .status-complete { opacity: 0.6; }
  .milestone-list { list-style: none; padding: 0; margin: 16px 0; }
  .milestone-list li { padding: 6px 0; border-bottom: 1px solid #e2e8f0; font-size: 0.9rem; }
  .milestone-list li:last-child { border-bottom: none; }
  .ml-dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 8px; vertical-align: middle; }
  .ml-dot.milestone { background: #6366f1; }
  .ml-dot.deliverable { background: #10b981; }
  .ml-dot.review { background: #f59e0b; }
  .ml-date { color: #64748b; font-size: 0.8rem; margin-left: 8px; }
  .timeline-static { display: none; }
  @media print { body { padding: 0; } h1 { font-size: 1rem; } #timeline { display: none; } .timeline-static { display: block; } }
</style>
</head>
<body>
<h1>${escapeHtml(projectName)} — Project Timeline</h1>
<div id="timeline"></div>
<div class="timeline-static">${staticList}</div>
<script>
var items = new vis.DataSet(${JSON.stringify(items)});
var container = document.getElementById("timeline");
var timeline = new vis.Timeline(container, items, {
  height: "400px",
  zoomMin: 1000 * 60 * 60 * 24 * 7,
  zoomMax: 1000 * 60 * 60 * 24 * 365 * 2,
  margin: { item: 10 },
});
timeline.fit();
<\/script>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
