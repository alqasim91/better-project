import { HelpCircle } from "lucide-react";

interface InfoHintProps {
  label: string;
  className?: string;
}

export function InfoHint({ label, className }: InfoHintProps) {
  return (
    <button
      type="button"
      tabIndex={0}
      aria-label={label}
      title={label}
      className={
        "inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring " +
        (className ?? "")
      }
    >
      <HelpCircle className="h-4 w-4" />
    </button>
  );
}
