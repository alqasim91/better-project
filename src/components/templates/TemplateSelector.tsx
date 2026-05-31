import { useState } from "react";
import {
  ArrowRight,
  Code2,
  FileText,
  HardHat,
  History,
  Megaphone,
  RotateCcw,
  Sparkles,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";
import { getAllTemplates, type CharterTemplate } from "@/lib/templateRegistry";
import { useCharterStore } from "@/stores/charterStore";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Icons referenced by templates, mapped explicitly so the bundler can tree-shake. */
const TEMPLATE_ICONS: Record<string, LucideIcon> = {
  FileText,
  Code2,
  Megaphone,
  HardHat,
  Stethoscope,
};

/** Resolve a template's Lucide icon by name, falling back to FileText. */
function TemplateIcon({ name, className }: { name: string; className?: string }) {
  const Icon = TEMPLATE_ICONS[name] ?? FileText;
  return <Icon className={className} />;
}

interface TemplateSelectorProps {
  onSelected?: () => void;
  /** Start in the wizard with the AI draft flow open. Seeds the chosen template
   *  (or a blank charter) first so AI has industry context. */
  onStartWithAI?: () => void;
  /** Project name of a saved draft, if one exists. Shows the resume banner. */
  draftName?: string | null;
  /** Restore the saved draft and enter the wizard. */
  onResume?: () => void;
  /** Discard the saved draft and start clean. */
  onDiscardDraft?: () => void;
}

/**
 * Smart Template picker shown before the wizard. Selecting a template seeds
 * the charter store with industry defaults and advances to the form engine.
 * The AI-first banner is the primary path: describe the project, let AI draft.
 */
export function TemplateSelector({
  onSelected,
  onStartWithAI,
  draftName,
  onResume,
  onDiscardDraft,
}: TemplateSelectorProps) {
  const templates = getAllTemplates();
  const selectTemplate = useCharterStore((s) => s.selectTemplate);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleContinue = () => {
    if (!selectedId) return;
    selectTemplate(selectedId);
    onSelected?.();
  };

  const handleStartWithAI = () => {
    // Seed whatever the user has highlighted, or a blank charter, so the AI
    // draft has industry context to work from.
    selectTemplate(selectedId ?? "blank");
    onStartWithAI?.();
  };

  return (
    <div className="space-y-8">
      {/* Returning user: offer to resume the saved draft, or wipe it and start clean. */}
      {draftName && (
        <div className="flex flex-col gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2">
            <History className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-medium text-amber-900">
                Pick up where you left off
              </p>
              <p className="text-sm text-amber-800">
                You have a saved draft:{" "}
                <span className="font-medium">{draftName}</span>. Starting a new
                charter below will replace it.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button size="sm" onClick={() => onResume?.()}>
              <History className="h-4 w-4" /> Resume draft
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDiscardDraft?.()}
            >
              <RotateCcw className="h-4 w-4" /> Start over
            </Button>
          </div>
        </div>
      )}

      {/* AI-first hero — the primary path. */}
      <div className="overflow-hidden rounded-xl border bg-gradient-to-br from-primary/10 via-primary/5 to-background p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" /> Fastest way to start
            </div>
            <h2 className="text-2xl font-bold tracking-tight">
              Describe your project — AI drafts the charter
            </h2>
            <p className="max-w-xl text-sm text-muted-foreground">
              Give AI a project name and a sentence or two. It fills every
              section for you, and you refine from there. No blank pages.
            </p>
          </div>
          <Button size="lg" onClick={handleStartWithAI} className="shrink-0">
            <Sparkles className="h-4 w-4" /> Draft with AI
          </Button>
        </div>
      </div>

      <div className="space-y-1">
        <h3 className="text-lg font-semibold tracking-tight">
          Or fill it in yourself
        </h3>
        <p className="text-sm text-muted-foreground">
          Pick a Smart Template to pre-fill industry defaults, or start blank.
          You can still ask AI for help at any point.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template: CharterTemplate) => {
          const active = template.id === selectedId;
          return (
            <Card
              key={template.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedId(template.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setSelectedId(template.id);
              }}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active && "ring-2 ring-primary",
              )}
            >
              <CardHeader>
                <div
                  className={cn(
                    "mb-2 flex h-10 w-10 items-center justify-center rounded-md",
                    template.accent,
                  )}
                >
                  <TemplateIcon name={template.icon} className="h-5 w-5" />
                </div>
                <CardTitle>{template.name}</CardTitle>
                <CardDescription>{template.industry}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {template.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleContinue} disabled={!selectedId} size="lg">
          Continue
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
