import type { LC } from "@/lib/lc-types";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, FileText, ShieldCheck, Landmark, Wallet, FilePlus2 } from "lucide-react";

type Step = {
  key: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  timestamp?: string;
  actor?: string;
  complete: boolean;
};

function fmtDT(s?: string) {
  if (!s) return undefined;
  return new Date(s).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

export function StatusTimeline({ lc }: { lc: LC }) {
  const created = lc.history.find((h) => h.action === "LC_CREATED" || h.action === "CREATED");
  const firstDoc = [...lc.documents].sort((a, b) => a.uploadedAt.localeCompare(b.uploadedAt))[0];
  const lastDoc = [...lc.documents].sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))[0];
  const docsComplete = lc.documents.length >= 2;

  const steps: Step[] = [
    {
      key: "created",
      label: "LC issued",
      description: `Issued by ${lc.importerBank}`,
      icon: FilePlus2,
      timestamp: created?.timestamp ?? lc.issueDate,
      actor: created?.actor ?? lc.importerBank,
      complete: true,
    },
    {
      key: "docs",
      label: docsComplete ? "Documents uploaded" : `Documents (${lc.documents.length}/2)`,
      description: docsComplete
        ? "Invoice and bill of lading on IPFS"
        : lc.documents.length === 0
          ? "Awaiting upload by exporter"
          : "Awaiting remaining document",
      icon: FileText,
      timestamp: docsComplete ? lastDoc?.uploadedAt : firstDoc?.uploadedAt,
      actor: lastDoc?.uploadedBy,
      complete: docsComplete,
    },
    {
      key: "customs",
      label: "Customs approval",
      description: lc.customsApprovedAt ? "Cleared by customs" : "Awaiting customs officer",
      icon: ShieldCheck,
      timestamp: lc.customsApprovedAt,
      actor: lc.customsApprovedBy,
      complete: !!lc.customsApprovedAt,
    },
    {
      key: "bank",
      label: "Bank approval",
      description: lc.bankApprovedAt ? "Signed off by bank" : "Awaiting bank officer",
      icon: Landmark,
      timestamp: lc.bankApprovedAt,
      actor: lc.bankApprovedBy,
      complete: !!lc.bankApprovedAt,
    },
    {
      key: "payment",
      label: "Payment released",
      description: lc.paymentReleasedAt
        ? "Funds released to exporter"
        : "Auto-releases once both approvals are in",
      icon: Wallet,
      timestamp: lc.paymentReleasedAt,
      actor: lc.paymentReleasedAt ? "chaincode" : undefined,
      complete: !!lc.paymentReleasedAt,
    },
  ];

  return (
    <ol className="relative space-y-5">
      {steps.map((s, i) => {
        const Icon = s.icon;
        const isLast = i === steps.length - 1;
        const nextComplete = !isLast && steps[i + 1].complete;
        return (
          <li key={s.key} className="relative flex gap-4">
            {!isLast && (
              <span
                aria-hidden
                className={cn(
                  "absolute left-[19px] top-10 bottom-[-20px] w-px",
                  nextComplete || s.complete ? "bg-accent/60" : "bg-border",
                )}
              />
            )}
            <div
              className={cn(
                "relative z-10 h-10 w-10 rounded-full flex items-center justify-center border shrink-0 transition-colors",
                s.complete
                  ? "bg-accent text-accent-foreground border-accent shadow-soft"
                  : "bg-background text-muted-foreground border-border",
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium">{s.label}</div>
                  {s.complete ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
                  ) : (
                    <Circle className="h-3.5 w-3.5 text-muted-foreground/60" />
                  )}
                </div>
                {s.timestamp && (
                  <time className="text-xs text-muted-foreground font-mono">{fmtDT(s.timestamp)}</time>
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {s.description}
                {s.actor && s.complete ? <span> · by {s.actor}</span> : null}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
