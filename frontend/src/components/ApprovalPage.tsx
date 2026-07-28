import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "./StatusBadge";
import { LifecycleStepper } from "./LifecycleStepper";
import type { LC, Role } from "@/lib/lc-types";
import { ArrowLeft, CheckCircle2, FileText, Info } from "lucide-react";

interface Props {
  lc: LC;
  icon: any;
  role: Role;
  expectedRole: Role;
  title: string;
  chaincode: string;
  description: string;
  officer: string;
  setOfficer: (v: string) => void;
  approved?: string;
  approvedBy?: string;
  canApprove: boolean;
  onApprove: () => void;
}

export function ApprovalPage({ lc, icon: Icon, role, expectedRole, title, chaincode, description, officer, setOfficer, approved, approvedBy, canApprove, onApprove }: Props) {
  const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: lc.currency, maximumFractionDigits: 0 }).format(n);

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto space-y-6">
      <Link to="/lcs/$lcId" params={{ lcId: lc.lcId }} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to {lc.lcId}
      </Link>

      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-xl gradient-accent flex items-center justify-center shadow-soft shrink-0">
          <Icon className="h-6 w-6 text-accent-foreground" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Chaincode · {chaincode}</div>
          <h1 className="text-2xl font-semibold tracking-tight mt-1">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">{description}</p>
        </div>
      </div>

      <Card className="shadow-soft">
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground">{lc.lcId}</span>
                <StatusBadge status={lc.status} />
              </div>
              <div className="font-medium mt-1">{lc.commodity}</div>
              <div className="text-xs text-muted-foreground">{lc.importer} → {lc.exporter}</div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Value</div>
              <div className="text-xl font-semibold">{fmt(lc.amount)}</div>
            </div>
          </div>
          <div className="pt-4 border-t border-border">
            <LifecycleStepper lc={lc} />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader><CardTitle className="text-base">Documents on file</CardTitle></CardHeader>
        <CardContent>
          {lc.documents.length === 0 ? (
            <div className="text-sm text-muted-foreground py-4 text-center">No documents uploaded yet — approval blocked.</div>
          ) : (
            <div className="grid gap-2 md:grid-cols-2">
              {lc.documents.map((d) => (
                <div key={d.cid} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                  <FileText className="h-4 w-4 text-info" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{d.fileName}</div>
                    <div className="text-[11px] text-muted-foreground uppercase tracking-wider">{d.docType.replace(/_/g, " ")}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {approved ? (
        <div className="rounded-lg bg-success/15 text-success-foreground p-5 flex items-start gap-3">
          <CheckCircle2 className="h-6 w-6 mt-0.5" />
          <div>
            <div className="font-medium">{title} already recorded</div>
            <div className="text-sm opacity-80">
              Signed by {approvedBy} on {new Date(approved).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}.
            </div>
          </div>
        </div>
      ) : (
        <Card className="shadow-soft">
          <CardHeader><CardTitle className="text-base">Sign & submit</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {role !== expectedRole && (
              <div className="rounded-lg border border-warning/40 bg-warning/10 p-4 flex items-start gap-3">
                <Info className="h-5 w-5 mt-0.5" />
                <div className="text-sm">
                  You're acting as <span className="font-medium">{role}</span>. Switch to <span className="font-medium">{expectedRole}</span> from the top-right selector.
                </div>
              </div>
            )}
            <div>
              <Label>Approver identifier</Label>
              <Input className="mt-1.5" value={officer} onChange={(e) => setOfficer(e.target.value)} />
              <div className="text-xs text-muted-foreground mt-1">Recorded on the ledger as the signing identity.</div>
            </div>
            <div className="flex justify-end">
              <Button onClick={onApprove} disabled={!canApprove}>Approve & record</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
