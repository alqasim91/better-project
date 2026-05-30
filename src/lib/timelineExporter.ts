import type { TimelineMilestone } from "@/types/timeline";

/**
 * Generate a standalone HTML file with an embedded vis-timeline loaded from
 * CDN. The result is a self-contained document a stakeholder can open in
 * any browser without a server.
 */
export function exportTimelineToHTML(
  milestones: TimelineMilestone[],
  projectName: string,
): string {
  const items = milestones
    .filter((m) => m.date)
    .map((m) => ({
      id: m.id,
      content: m.title || "Untitled",
      start: m.date,
      className: `type-${m.type} status-${m.status}`,
      type: "box" as const,
    }));

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${escapeHtml(projectName)} — Timeline</title>
<link href="https://unpkg.com/vis-timeline@7.7.3/styles/vis-timeline-graph2d.min.css" rel="stylesheet">
<script src="https://unpkg.com/vis-timeline@7.7.3/standalone/umd/vis-timeline-graph2d.min.js"><\/script>
<style>
  body { font-family: system-ui, sans-serif; margin: 0; padding: 20px; background: #fafafa; }
  h1 { font-size: 1.25rem; margin-bottom: 16px; }
  #timeline { border: 1px solid #e2e8f0; border-radius: 8px; background: #fff; }
  .type-milestone { background: #6366f1; color: #fff; border-color: #4f46e5; }
  .type-deliverable { background: #10b981; color: #fff; border-color: #059669; }
  .type-review { background: #f59e0b; color: #fff; border-color: #d97706; }
  .status-complete { opacity: 0.6; }
  @media print { body { padding: 0; } h1 { font-size: 1rem; } }
</style>
</head>
<body>
<h1>${escapeHtml(projectName)} — Project Timeline</h1>
<div id="timeline"></div>
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
