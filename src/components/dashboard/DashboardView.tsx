import { Clock, Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TimelineDashboard } from "@/components/timeline/TimelineDashboard";
import { StakeholderMapper } from "@/components/stakeholders/StakeholderMapper";
import { useCharterStore } from "@/stores/charterStore";

/**
 * Phase 3 dashboard: timeline visualization + stakeholder power/interest
 * mapper side by side (stacked on mobile).
 */
export function DashboardView() {
  const projectName = useCharterStore((s) => s.charter.basics.projectName);

  return (
    <div className="space-y-6">
      {projectName && (
        <h2 className="text-xl font-bold tracking-tight">{projectName}</h2>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" /> Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TimelineDashboard />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> Stakeholder Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StakeholderMapper />
        </CardContent>
      </Card>
    </div>
  );
}
