import { useEffect, useState } from "react";
import {
  Eye,
  EyeOff,
  ShieldCheck,
  Trash2,
  ExternalLink,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useByokStore,
  DEFAULT_MODEL_BY_PROVIDER,
  PROVIDER_LABEL,
} from "@/stores/byokStore";
import { clientChatCompletion, type AiProvider } from "@/services/ai/clientAi";

type TestState =
  | { status: "idle" }
  | { status: "running" }
  | { status: "ok"; modelEcho: string; elapsedMs: number }
  | { status: "error"; message: string };

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PROVIDER_HELP: Record<
  AiProvider,
  { keyHint: string; modelHint: string; keyUrl: string }
> = {
  gemini: {
    keyHint: "Get a free key at aistudio.google.com",
    modelHint: "e.g. gemini-2.5-flash, gemini-2.5-pro",
    keyUrl: "https://aistudio.google.com/app/apikey",
  },
  openai: {
    keyHint: "Get a key at platform.openai.com (or use any OpenAI-compatible provider)",
    modelHint: "e.g. gpt-4o-mini, gpt-4o",
    keyUrl: "https://platform.openai.com/api-keys",
  },
  anthropic: {
    keyHint: "Get a key at console.anthropic.com",
    modelHint: "e.g. claude-haiku-4-5, claude-sonnet-4-6",
    keyUrl: "https://console.anthropic.com/settings/keys",
  },
};

export function ByokSettingsModal({ open, onOpenChange }: Props) {
  const stored = useByokStore();

  const [provider, setProvider] = useState<AiProvider>(stored.provider);
  const [apiKey, setApiKey] = useState(stored.apiKey);
  const [model, setModel] = useState(stored.model);
  const [baseUrl, setBaseUrl] = useState(stored.baseUrl);
  const [reveal, setReveal] = useState(false);
  const [test, setTest] = useState<TestState>({ status: "idle" });

  // Reset local form to stored values whenever the modal reopens.
  useEffect(() => {
    if (open) {
      setProvider(stored.provider);
      setApiKey(stored.apiKey);
      setModel(stored.model);
      setBaseUrl(stored.baseUrl);
      setReveal(false);
      setTest({ status: "idle" });
    }
    // intentionally exclude stored.* — we only re-sync on open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Any edit invalidates a prior test result.
  useEffect(() => {
    setTest({ status: "idle" });
  }, [provider, apiKey, model, baseUrl]);

  const handleProviderChange = (p: AiProvider) => {
    setProvider(p);
    // Suggest a sensible default model when switching providers, but only if
    // the user hasn't typed anything custom yet for the new provider.
    const looksDefault =
      !model.trim() ||
      Object.values(DEFAULT_MODEL_BY_PROVIDER).includes(model.trim());
    if (looksDefault) setModel(DEFAULT_MODEL_BY_PROVIDER[p]);
  };

  const handleSave = () => {
    stored.save({
      provider,
      apiKey: apiKey.trim(),
      model: model.trim(),
      baseUrl: baseUrl.trim() || undefined,
    });
    onOpenChange(false);
  };

  const handleClear = () => {
    stored.clear();
    setApiKey("");
    setBaseUrl("");
    setModel(DEFAULT_MODEL_BY_PROVIDER[provider]);
  };

  const handleTest = async () => {
    setTest({ status: "running" });
    const startedAt = performance.now();
    try {
      const result = await clientChatCompletion(
        {
          provider,
          apiKey: apiKey.trim(),
          model: model.trim(),
          baseUrl: baseUrl.trim() || undefined,
        },
        [
          {
            role: "system",
            content:
              'Respond with ONLY a JSON object: {"ok": true}. No prose, no markdown.',
          },
          { role: "user", content: "ping" },
        ],
        { temperature: 0 },
      );
      const elapsedMs = Math.round(performance.now() - startedAt);
      setTest({ status: "ok", modelEcho: result.model, elapsedMs });
    } catch (err) {
      setTest({
        status: "error",
        message: (err as Error).message || "Request failed",
      });
    }
  };

  const help = PROVIDER_HELP[provider];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl" onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>AI Provider Settings</DialogTitle>
          <DialogDescription>
            Bring your own API key. The app will call your chosen provider
            directly from this browser.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="space-y-1">
              <p className="font-medium">Your key stays in this browser.</p>
              <p>
                It's saved only in this browser's local storage and sent
                directly to the provider you pick. It is never sent to,
                logged by, or visible to the operator of this site.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Provider</Label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(PROVIDER_LABEL) as AiProvider[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleProviderChange(p)}
                  className={`rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                    provider === p
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-input hover:bg-muted/50"
                  }`}
                >
                  {PROVIDER_LABEL[p]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="byok-key">API Key</Label>
              <a
                href={help.keyUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                Get a key <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="relative">
              <Input
                id="byok-key"
                type={reveal ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Paste your API key here"
                autoComplete="off"
                spellCheck={false}
                className="pr-10 font-mono"
              />
              <button
                type="button"
                onClick={() => setReveal((r) => !r)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                aria-label={reveal ? "Hide key" : "Show key"}
              >
                {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">{help.keyHint}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="byok-model">Model</Label>
            <Input
              id="byok-model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={DEFAULT_MODEL_BY_PROVIDER[provider]}
              spellCheck={false}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">{help.modelHint}</p>
          </div>

          {provider === "openai" && (
            <div className="space-y-2">
              <Label htmlFor="byok-base">
                Custom base URL{" "}
                <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="byok-base"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://api.openai.com/v1"
                spellCheck={false}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Use any OpenAI-compatible endpoint (Groq, OpenRouter, Together,
                local LM Studio at http://localhost:1234/v1, etc.).
              </p>
            </div>
          )}

          {stored.apiKey && (
            <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
              Currently saved:{" "}
              <span className="font-mono text-foreground">
                {PROVIDER_LABEL[stored.provider]} · {stored.model} · key ending
                in …{stored.apiKey.slice(-4)}
              </span>
            </div>
          )}

          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTest}
              disabled={
                test.status === "running" || !apiKey.trim() || !model.trim()
              }
            >
              {test.status === "running" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Testing…
                </>
              ) : (
                <>Test connection</>
              )}
            </Button>
            {test.status === "ok" && (
              <div className="flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-900">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  Connected to <span className="font-mono">{test.modelEcho}</span>{" "}
                  in {test.elapsedMs}ms.
                </span>
              </div>
            )}
            {test.status === "error" && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span className="break-all">{test.message}</span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="mt-6 items-center justify-between sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClear}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" /> Clear key
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!apiKey.trim() || !model.trim()}
            >
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
