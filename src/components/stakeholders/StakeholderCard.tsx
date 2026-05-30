import { User, Building2, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { StakeholderNode } from "@/types/stakeholder";
import { cn } from "@/lib/utils";

const CATEGORY_CONFIG = {
  internal: { Icon: User, color: "text-indigo-600" },
  external: { Icon: Building2, color: "text-emerald-600" },
  regulatory: { Icon: Shield, color: "text-amber-600" },
} as const;

interface StakeholderCardProps {
  node: StakeholderNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

/**
 * Compact card for a stakeholder node showing name, role, category icon,
 * and influence/interest scores.
 */
export function StakeholderCard({ node, className, style, onClick }: StakeholderCardProps) {
  const { Icon, color } = CATEGORY_CONFIG[node.category];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-left text-sm shadow-sm transition-shadow hover:shadow-md",
        className,
      )}
      style={style}
    >
      <Icon className={cn("h-4 w-4 shrink-0", color)} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium leading-tight">{node.name || "Unnamed"}</p>
        <p className="truncate text-xs text-muted-foreground">{node.role}</p>
      </div>
      <div className="flex shrink-0 gap-1">
        <Badge variant="outline" className="text-[10px]" title="Influence">
          I:{node.influence}
        </Badge>
        <Badge variant="outline" className="text-[10px]" title="Interest">
          N:{node.interest}
        </Badge>
      </div>
    </button>
  );
}
