import { useState } from "react";
import {
  ArrowRight,
  Code2,
  FileText,
  HardHat,
  Megaphone,
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
}

/**
 * Smart Template picker shown before the wizard. Selecting a template seeds
 * the charter store with industry defaults and advances to the form engine.
 */
export function TemplateSelector({ onSelected }: TemplateSelectorProps) {
  const templates = getAllTemplates();
  const selectTemplate = useCharterStore((s) => s.selectTemplate);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleContinue = () => {
    if (!selectedId) return;
    selectTemplate(selectedId);
    onSelected?.();
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">Choose a starting point</h2>
        <p className="text-muted-foreground">
          Pick a Smart Template to pre-fill industry defaults, or start blank.
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
