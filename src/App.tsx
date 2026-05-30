import { useState } from "react";
import { Sparkles, LayoutDashboard, FileEdit } from "lucide-react";
import { TemplateSelector } from "@/components/templates/TemplateSelector";
import { WizardContainer } from "@/components/wizard/WizardContainer";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { Button } from "@/components/ui/button";

type Stage = "select-template" | "wizard" | "dashboard";

export default function App() {
  const [stage, setStage] = useState<Stage>("select-template");

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-semibold leading-tight">Better Project</h1>
              <p className="text-xs text-muted-foreground">Project Charter Builder</p>
            </div>
          </div>

          {/* Tab switcher shown once past template selection */}
          {stage !== "select-template" && (
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant={stage === "wizard" ? "default" : "ghost"}
                onClick={() => setStage("wizard")}
              >
                <FileEdit className="h-4 w-4" /> Editor
              </Button>
              <Button
                size="sm"
                variant={stage === "dashboard" ? "default" : "ghost"}
                onClick={() => setStage("dashboard")}
              >
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="container py-8">
        {stage === "select-template" && (
          <TemplateSelector onSelected={() => setStage("wizard")} />
        )}
        {stage === "wizard" && (
          <WizardContainer onChangeTemplate={() => setStage("select-template")} />
        )}
        {stage === "dashboard" && <DashboardView />}
      </main>
    </div>
  );
}
