import { Flag, Package, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { TimelineMilestone } from "@/types/timeline";
import { cn } from "@/lib/utils";

const TYPE_CONFIG = {
  milestone: { Icon: Flag, color: "bg-indigo-100 text-indigo-700" },
  deliverable: { Icon: Package, color: "bg-emerald-100 text-emerald-700" },
  review: { Icon: Eye, color: "bg-amber-100 text-amber-700" },
} as const;

const STATUS_BADGE = {
  pending: { variant: "outline" as const, label: "Pending" },
  "in-progress": { variant: "warning" as const, label: "In Progress" },
  complete: { variant: "success" as const, label: "Complete" },
} as const;

interface MilestoneMarkerProps {
  milestone: TimelineMilestone;
  className?: string;
  onClick?: () => void;
}

/**
 * Visual card for a milestone showing its type icon, title, date, and status
 * badge. Used in list views and as a tooltip template for the timeline.
 */
export function MilestoneMarker({ milestone, className, onClick }: MilestoneMarkerProps) {
  const { Icon, color } = TYPE_CONFIG[milestone.type];
  const status = STATUS_BADGE[milestone.status];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-start gap-2 rounded-md border bg-card p-2 text-left text-sm shadow-sm transition-shadow hover:shadow-md",
        className,
      )}
    >
      <div className={cn("mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded", color)}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium leading-tight">{milestone.title || "Untitled"}</p>
        <p className="text-xs text-muted-foreground">{milestone.date || "No date"}</p>
      </div>
      <Badge variant={status.variant} className="shrink-0 text-[10px]">
        {status.label}
      </Badge>
    </button>
  );
}
