import { statusMeta } from "@/lib/lc-store";
import type { LCStatus } from "@/lib/lc-types";
import { cn } from "@/lib/utils";

export function StatusBadge({ status, className }: { status: LCStatus; className?: string }) {
  const meta = statusMeta[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium",
        meta.tone,
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {meta.label}
    </span>
  );
}
