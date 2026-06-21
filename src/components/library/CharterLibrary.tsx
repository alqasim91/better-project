import { useState } from "react";
import { FileText, Plus, Trash2, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  listCharters,
  loadCharter,
  deleteCharter,
  type CharterIndexEntry,
} from "@/lib/charterLibrary";
import { useCharterStore } from "@/stores/charterStore";
import { getTemplateById } from "@/lib/templateRegistry";

interface Props {
  /** Called after the user opens a charter — parent should switch to wizard. */
  onOpen: () => void;
  /** Called when the user starts a brand-new charter. */
  onNew: () => void;
}

export function CharterLibrary({ onOpen, onNew }: Props) {
  const [entries, setEntries] = useState<CharterIndexEntry[]>(() =>
    listCharters(),
  );
  const setCharter = useCharterStore((s) => s.setCharter);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleOpen = (id: string) => {
    const charter = loadCharter(id);
    if (!charter) return;
    setCharter(charter);
    onOpen();
  };

  const handleDelete = (id: string) => {
    deleteCharter(id);
    setEntries(listCharters());
    setConfirmDelete(null);
  };

  if (entries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" /> Your charters
          </CardTitle>
          <CardDescription>
            You don't have any saved charters yet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onNew}>
            <Plus className="h-4 w-4" /> Create your first charter
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Your charters</h2>
          <p className="text-sm text-muted-foreground">
            {entries.length} saved charter{entries.length === 1 ? "" : "s"}.
            Charters are stored only in this browser.
          </p>
        </div>
        <Button onClick={onNew}>
          <Plus className="h-4 w-4" /> New charter
        </Button>
      </div>

      <div className="space-y-2">
        {entries.map((entry) => (
          <CharterRow
            key={entry.id}
            entry={entry}
            confirmDelete={confirmDelete === entry.id}
            onConfirmDelete={() => setConfirmDelete(entry.id)}
            onCancelDelete={() => setConfirmDelete(null)}
            onDelete={() => handleDelete(entry.id)}
            onOpen={() => handleOpen(entry.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface RowProps {
  entry: CharterIndexEntry;
  confirmDelete: boolean;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  onDelete: () => void;
  onOpen: () => void;
}

function CharterRow({
  entry,
  confirmDelete,
  onConfirmDelete,
  onCancelDelete,
  onDelete,
  onOpen,
}: RowProps) {
  const template = entry.templateId
    ? getTemplateById(entry.templateId)
    : undefined;
  return (
    <div className="flex items-center justify-between rounded-md border bg-background p-3">
      <button
        type="button"
        onClick={onOpen}
        className="flex flex-1 items-center gap-3 text-left"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <FileText className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">{entry.projectName}</p>
          <p className="text-xs text-muted-foreground">
            {template?.name ?? "Blank template"} · Last edited{" "}
            {formatRelative(entry.updatedAt)}
          </p>
        </div>
      </button>
      <div className="flex items-center gap-1">
        <Button size="sm" variant="outline" onClick={onOpen}>
          Open
        </Button>
        {confirmDelete ? (
          <>
            <Button size="sm" variant="ghost" onClick={onCancelDelete}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={onDelete}
            >
              Confirm delete
            </Button>
          </>
        ) : (
          <Button
            size="icon"
            variant="ghost"
            className="text-muted-foreground hover:text-destructive"
            onClick={onConfirmDelete}
            aria-label="Delete charter"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const sec = Math.round((now - then) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  if (sec < 30 * 86400) return `${Math.floor(sec / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}
