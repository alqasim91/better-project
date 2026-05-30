import { useState } from "react";
import { Sparkles } from "lucide-react";
import { TemplateSelector } from "@/components/templates/TemplateSelector";
import { WizardContainer } from "@/components/wizard/WizardContainer";

type Stage = "select-template" | "wizard";

export default function App() {
  const [stage, setStage] = useState<Stage>("select-template");

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="container flex h-16 items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-semibold leading-tight">Better Project</h1>
            <p className="text-xs text-muted-foreground">Project Charter Builder</p>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {stage === "select-template" ? (
          <TemplateSelector onSelected={() => setStage("wizard")} />
        ) : (
          <WizardContainer onChangeTemplate={() => setStage("select-template")} />
        )}
      </main>
    </div>
  );
}
