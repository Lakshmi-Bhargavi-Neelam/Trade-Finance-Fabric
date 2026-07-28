import type { LC } from "@/lib/lc-types";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const steps = [
  { key: "CREATED", label: "Created", who: "Bank Officer" },
  { key: "DOCUMENTS_UPLOADED", label: "Documents", who: "Exporter" },
  { key: "APPROVALS", label: "Approvals", who: "Customs + Bank" },
  { key: "PAYMENT_RELEASED", label: "Payment", who: "Chaincode" },
];

export function LifecycleStepper({ lc }: { lc: LC }) {
  const done = {
    CREATED: true,
    DOCUMENTS_UPLOADED: lc.documents.length >= 2 || ["DOCUMENTS_UPLOADED", "CUSTOMS_APPROVED", "BANK_APPROVED", "PAYMENT_RELEASED"].includes(lc.status),
    APPROVALS: !!(lc.customsApprovedAt && lc.bankApprovedAt),
    PAYMENT_RELEASED: lc.status === "PAYMENT_RELEASED",
  } as const;

  return (
    <div className="flex items-center gap-2 w-full overflow-x-auto pb-2">
      {steps.map((s, i) => {
        const complete = done[s.key as keyof typeof done];
        const next = steps[i + 1] && done[steps[i].key as keyof typeof done];
        return (
          <div key={s.key} className="flex items-center gap-2 flex-1 min-w-[140px]">
            <div className="flex flex-col items-start gap-1">
              <div
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium border transition-colors",
                  complete
                    ? "bg-accent text-accent-foreground border-accent shadow-soft"
                    : "bg-background text-muted-foreground border-border",
                )}
              >
                {complete ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <div>
                <div className="text-xs font-medium">{s.label}</div>
                <div className="text-[10px] text-muted-foreground">{s.who}</div>
              </div>
            </div>
            {i < steps.length - 1 && (
              <div className={cn("h-px flex-1", next ? "bg-accent" : "bg-border")} />
            )}
          </div>
        );
      })}
    </div>
  );
}
