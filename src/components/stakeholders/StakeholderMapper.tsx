import { useState } from "react";
import { Grid2x2, Network } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InfluenceMatrix } from "@/components/stakeholders/InfluenceMatrix";
import { RelationshipGraph } from "@/components/stakeholders/RelationshipGraph";
import { EngagementSuggestions } from "@/components/stakeholders/EngagementSuggestions";

type MapView = "matrix" | "network";

/**
 * Container that toggles between the Power/Interest Matrix and the
 * force-directed Relationship Graph.
 */
export function StakeholderMapper() {
  const [view, setView] = useState<MapView>("matrix");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant={view === "matrix" ? "default" : "outline"}
          onClick={() => setView("matrix")}
        >
          <Grid2x2 className="h-4 w-4" /> Matrix View
        </Button>
        <Button
          size="sm"
          variant={view === "network" ? "default" : "outline"}
          onClick={() => setView("network")}
        >
          <Network className="h-4 w-4" /> Network View
        </Button>
      </div>

      {view === "matrix" ? <InfluenceMatrix /> : <RelationshipGraph />}

      <EngagementSuggestions />
    </div>
  );
}
