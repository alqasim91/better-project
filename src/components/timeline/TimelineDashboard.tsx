import { useCallback, useEffect, useRef, useState } from "react";
import { Timeline as VisTimeline } from "vis-timeline/esnext";
import "vis-timeline/styles/vis-timeline-graph2d.css";
import { Download, Plus, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTimeline } from "@/hooks/useTimeline";
import { useCharterStore } from "@/stores/charterStore";
import { exportTimelineToHTML } from "@/lib/timelineExporter";
import { TimelineEditor } from "@/components/timeline/TimelineEditor";
import type { TimelineView } from "@/types/timeline";

const VIEW_OPTIONS: { value: TimelineView; label: string }[] = [
  { value: "linear", label: "Linear" },
  { value: "compact", label: "Compact" },
];

/**
 * Interactive vis-timeline widget with zoom controls, view toggle, milestone
 * CRUD, and "Export HTML" button.
 */
export function TimelineDashboard() {
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<VisTimeline | null>(null);
  const { milestones, dataset, addMilestone, updateMilestone, removeMilestone } =
    useTimeline();
  const projectName = useCharterStore((s) => s.charter.basics.projectName);

  const [view, setView] = useState<TimelineView>("linear");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Mount / destroy vis-timeline.
  useEffect(() => {
    if (!containerRef.current) return;
    const tl = new VisTimeline(containerRef.current, dataset, {
      height: "320px",
      margin: { item: 12 },
      stack: view !== "compact",
      zoomMin: 1000 * 60 * 60 * 24 * 7, // 1 week
      zoomMax: 1000 * 60 * 60 * 24 * 365 * 2, // 2 years
      orientation: "top",
      editable: false,
    });

    tl.on("select", (props: { items: string[] }) => {
      if (props.items.length === 1) {
        setEditingId(props.items[0]);
        setEditorOpen(true);
      }
    });

    timelineRef.current = tl;
    tl.fit();

    return () => {
      tl.destroy();
      timelineRef.current = null;
    };
    // Re-mount when view or dataset changes.
  }, [dataset, view]);

  const handleZoomIn = () => timelineRef.current?.zoomIn(0.4);
  const handleZoomOut = () => timelineRef.current?.zoomOut(0.4);
  const handleFit = () => timelineRef.current?.fit();

  const handleExportHTML = useCallback(() => {
    const html = exportTimelineToHTML(milestones, projectName || "Project");
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(projectName || "project").replace(/\s+/g, "-").toLowerCase()}-timeline.html`;
    a.click();
    URL.revokeObjectURL(url);
  }, [milestones, projectName]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          {VIEW_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              size="sm"
              variant={view === opt.value ? "default" : "outline"}
              onClick={() => setView(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <Button size="icon" variant="outline" onClick={handleZoomIn} title="Zoom in">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="outline" onClick={handleZoomOut} title="Zoom out">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="outline" onClick={handleFit} title="Fit all">
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setEditingId(null);
              setEditorOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Add
          </Button>
          <Button size="sm" variant="outline" onClick={handleExportHTML}>
            <Download className="h-4 w-4" /> Export HTML
          </Button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="rounded-lg border bg-background"
        style={{ minHeight: 320 }}
      />

      {milestones.length === 0 && (
        <p className="text-center text-sm text-muted-foreground">
          No milestones yet — add one to populate the timeline.
        </p>
      )}

      <TimelineEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        editingId={editingId}
        milestones={milestones}
        onAdd={addMilestone}
        onUpdate={updateMilestone}
        onRemove={removeMilestone}
      />
    </div>
  );
}
