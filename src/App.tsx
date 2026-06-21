import { useEffect, useState } from "react";
import {
  Sparkles,
  LayoutDashboard,
  FileEdit,
  FileDown,
  Settings,
  KeyRound,
  FolderOpen,
} from "lucide-react";
import { TemplateSelector } from "@/components/templates/TemplateSelector";
import { WizardContainer } from "@/components/wizard/WizardContainer";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { FinalReview } from "@/components/charter/FinalReview";
import { Button } from "@/components/ui/button";
import { ByokSettingsModal } from "@/components/settings/ByokSettingsModal";
import { CharterLibrary } from "@/components/library/CharterLibrary";
import {
  loadPersistedCharter,
  clearPersistedCharter,
} from "@/hooks/useFormPersistence";
import { listCharters } from "@/lib/charterLibrary";
import { useCharterStore } from "@/stores/charterStore";
import { useByokStore, PROVIDER_LABEL } from "@/stores/byokStore";

type Stage = "select-template" | "wizard" | "dashboard" | "export" | "library";

export default function App() {
  const [stage, setStage] = useState<Stage>("select-template");
  // When true, the wizard opens the AI draft modal on entry (AI-first path).
  const [autoOpenAI, setAutoOpenAI] = useState(false);
  // Project name of a saved draft found on load, if any.
  const [draftName, setDraftName] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [charterCount, setCharterCount] = useState(0);
  const setCharter = useCharterStore((s) => s.setCharter);
  const resetCharter = useCharterStore((s) => s.reset);
  const byokProvider = useByokStore((s) => s.provider);
  const byokKey = useByokStore((s) => s.apiKey);
  const hasByok = byokKey.trim().length > 0;

  // Detect saved drafts once on load so we can offer to resume / show the library.
  useEffect(() => {
    const draft = loadPersistedCharter();
    if (draft) setDraftName(draft.basics.projectName.trim() || "Untitled draft");
    setCharterCount(listCharters().length);
  }, [stage]);

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

          <div className="flex items-center gap-1">
            {/* Library button — shown whenever there's at least one saved charter. */}
            {charterCount > 0 && stage !== "library" && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setStage("library")}
                title="My charters"
              >
                <FolderOpen className="h-4 w-4" />
                <span className="hidden sm:inline">My charters</span>
                <span className="ml-1 rounded bg-muted px-1.5 text-xs">
                  {charterCount}
                </span>
              </Button>
            )}
            {/* Tab switcher shown once past template selection. Editor → Export is
                the core path; Visuals is an optional extra, set apart on the right. */}
            {stage !== "select-template" && stage !== "library" && (
              <>
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
                <span className="mx-1 h-5 w-px bg-border" aria-hidden />
              </>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSettingsOpen(true)}
              title="AI provider settings"
              className={hasByok ? "text-emerald-700 hover:text-emerald-800" : ""}
            >
              {hasByok ? (
                <>
                  <KeyRound className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {PROVIDER_LABEL[byokProvider]}
                  </span>
                </>
              ) : (
                <>
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Use my API key</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      <ByokSettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />

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
        {stage === "library" && (
          <CharterLibrary
            onOpen={() => setStage("wizard")}
            onNew={() => {
              resetCharter();
              setStage("select-template");
            }}
          />
        )}
      </main>
    </div>
  );
}
