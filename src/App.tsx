import { useEffect, useState } from "react";
import {
  Sparkles,
  LayoutDashboard,
  FileEdit,
  FileDown,
} from "lucide-react";
import { TemplateSelector } from "@/components/templates/TemplateSelector";
import { WizardContainer } from "@/components/wizard/WizardContainer";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { FinalReview } from "@/components/charter/FinalReview";
import { Button } from "@/components/ui/button";
import {
  loadPersistedCharter,
  clearPersistedCharter,
} from "@/hooks/useFormPersistence";
import { useCharterStore } from "@/stores/charterStore";

type Stage = "select-template" | "wizard" | "dashboard" | "export";

export default function App() {
  const [stage, setStage] = useState<Stage>("select-template");
  // When true, the wizard opens the AI draft modal on entry (AI-first path).
  const [autoOpenAI, setAutoOpenAI] = useState(false);
  // Project name of a saved draft found on load, if any.
  const [draftName, setDraftName] = useState<string | null>(null);
  const setCharter = useCharterStore((s) => s.setCharter);
  const resetCharter = useCharterStore((s) => s.reset);

  // Detect a saved draft once on load so we can offer to resume it.
  useEffect(() => {
    const draft = loadPersistedCharter();
    if (draft) setDraftName(draft.basics.projectName.trim() || "Untitled draft");
  }, []);

  const handleResume = () => {
    const draft = loadPersistedCharter();
    if (draft) setCharter(draft);
    setStage("wizard");
  };

  const handleDiscardDraft = () => {
    clearPersistedCharter();
    resetCharter();
    setDraftName(null);
  };

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

          {/* Tab switcher shown once past template selection. Editor → Export is
              the core path; Visuals is an optional extra, set apart on the right. */}
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
                variant={stage === "export" ? "default" : "ghost"}
                onClick={() => setStage("export")}
              >
                <FileDown className="h-4 w-4" /> Export
              </Button>
              <span className="mx-1 h-5 w-px bg-border" aria-hidden />
              <Button
                size="sm"
                variant={stage === "dashboard" ? "secondary" : "ghost"}
                onClick={() => setStage("dashboard")}
                className="text-muted-foreground"
                title="Optional timeline & stakeholder visuals"
              >
                <LayoutDashboard className="h-4 w-4" /> Visuals
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="container py-8">
        {stage === "select-template" && (
          <TemplateSelector
            onSelected={() => setStage("wizard")}
            onStartWithAI={() => {
              setAutoOpenAI(true);
              setStage("wizard");
            }}
            draftName={draftName}
            onResume={handleResume}
            onDiscardDraft={handleDiscardDraft}
          />
        )}
        {stage === "wizard" && (
          <WizardContainer
            onChangeTemplate={() => {
              // "Start over" in the wizard already clears the saved draft.
              setDraftName(null);
              setStage("select-template");
            }}
            onFinish={() => setStage("export")}
            autoOpenAI={autoOpenAI}
            onAutoOpenConsumed={() => setAutoOpenAI(false)}
          />
        )}
        {stage === "dashboard" && <DashboardView />}
        {stage === "export" && <FinalReview />}
      </main>
    </div>
  );
}
