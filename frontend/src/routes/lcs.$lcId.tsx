import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { LifecycleStepper } from "@/components/LifecycleStepper";
import { StatusTimeline } from "@/components/StatusTimeline";
import { useLC, useInvalidateLCs } from "@/lib/use-lcs";
import { lcStore } from "@/lib/lc-store";
import { useRole } from "@/lib/role-context";
import { toast } from "sonner";
import { ArrowLeft, FileText, Ship, ShieldCheck, Landmark, Wallet, Copy, ExternalLink } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/lcs/$lcId")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.lcId} · Letter of Credit` },
      { name: "description", content: `Details, documents, approvals and ledger history for Letter of Credit ${params.lcId}.` },
      { property: "og:title", content: `${params.lcId} · Letter of Credit` },
      { property: "og:description", content: `Details, documents, approvals and ledger history for LC ${params.lcId}.` },
    ],
  }),
  component: LCDetail,
  notFoundComponent: () => (
    <AppShell>
      <div className="p-10 text-center">
        <h1 className="text-2xl font-semibold">Letter of Credit not found</h1>
        <p className="text-muted-foreground mt-2">It may have been removed or never issued.</p>
        <Button asChild className="mt-6"><Link to="/lcs">Back to all LCs</Link></Button>
      </div>
    </AppShell>
  ),
});

function LCDetail() {
  const { lcId } = Route.useParams();
  const lc = useLC(lcId);
  const { role } = useRole();
  const invalidate = useInvalidateLCs();

  if (!lc) {
    return (
      <AppShell>
        <div className="p-10 text-center">
          <div className="text-muted-foreground text-sm">Loading LC {lcId}…</div>
          <Button asChild variant="ghost" className="mt-4"><Link to="/lcs">Back</Link></Button>
        </div>
      </AppShell>
    );
  }

  const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: lc.currency, maximumFractionDigits: 0 }).format(n);
  const fmtDate = (s: string) => new Date(s).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  const fmtDT = (s: string) => new Date(s).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });

  const canCustoms = role === "Customs Officer" && lc.status !== "CREATED" && !lc.customsApprovedAt;
  const canBank = role === "Bank Officer" && lc.status !== "CREATED" && !lc.bankApprovedAt;

  const doCustoms = async () => {
    try {
      await lcStore.customsApproval(role, lc.lcId, "customs.demo");
      invalidate(lc.lcId);
      toast.success("Customs approval recorded", { description: "Ledger updated." });
    } catch (e: any) { toast.error(e.message); }
  };
  const doBank = async () => {
    try {
      const updated = await lcStore.bankApproval(role, lc.lcId, "bank.demo");
      invalidate(lc.lcId);
      toast.success("Bank approval recorded", {
        description: updated.status === "PAYMENT_RELEASED" ? "Payment automatically released." : "Ledger updated.",
      });
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <AppShell>
      <div className="p-6 lg:p-10 max-w-[1400px] mx-auto space-y-6">
        <Link to="/lcs" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> All LCs
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm text-muted-foreground">{lc.lcId}</span>
              <StatusBadge status={lc.status} />
            </div>
            <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight mt-2 max-w-2xl">{lc.commodity}</h1>
            <div className="text-sm text-muted-foreground mt-1">{lc.importer} → {lc.exporter}</div>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">LC Value</div>
            <div className="text-3xl font-semibold tracking-tight">{fmt(lc.amount)}</div>
            <div className="text-xs text-muted-foreground">Expires {fmtDate(lc.expiryDate)}</div>
          </div>
        </div>

        <Card className="shadow-soft">
          <CardContent className="p-6">
            <LifecycleStepper lc={lc} />
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="timeline">Status timeline</TabsTrigger>
                <TabsTrigger value="documents">Documents ({lc.documents.length})</TabsTrigger>
                <TabsTrigger value="history">Ledger history ({lc.history.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-4">
                <Card className="shadow-soft">
                  <CardContent className="p-6 grid gap-6 md:grid-cols-2">
                    <Detail label="Importer">{lc.importer}</Detail>
                    <Detail label="Exporter">{lc.exporter}</Detail>
                    <Detail label="Importer's bank">{lc.importerBank}</Detail>
                    <Detail label="Exporter's bank">{lc.exporterBank}</Detail>
                    <Detail label="Commodity">{lc.commodity}</Detail>
                    <Detail label="Quantity">{lc.quantity}</Detail>
                    <Detail label="Issued">{fmtDate(lc.issueDate)}</Detail>
                    <Detail label="Expires">{fmtDate(lc.expiryDate)}</Detail>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="timeline" className="mt-4">
                <Card className="shadow-soft">
                  <CardHeader>
                    <CardTitle className="text-base">Status history</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 pt-2">
                    <StatusTimeline lc={lc} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="documents" className="mt-4">
                <Card className="shadow-soft">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">Documents in IPFS</CardTitle>
                    <Button asChild size="sm" variant="outline">
                      <Link to="/documents/$lcId"
 params={{ lcId: lc.lcId }}>Upload document</Link>
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {lc.documents.length === 0 && (
                      <div className="text-sm text-muted-foreground py-8 text-center">No documents uploaded yet.</div>
                    )}
                   {lc.documents.map((d, index) => (
  <div key={`${d.docType}-${d.cid || index}`} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/40">
                        <div className="h-9 w-9 rounded-lg bg-info/10 text-info flex items-center justify-center">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium">{d.fileName}</div>
                          <div className="text-xs text-muted-foreground flex flex-wrap gap-3">
                            <span className="uppercase tracking-wider">{d.docType.replace(/_/g, " ")}</span>
                            <span>by {d.uploadedBy}</span>
                            <span>{fmtDT(d.uploadedAt)}</span>
                          </div>
                          <div className="mt-1 flex flex-wrap gap-3 font-mono text-[11px] text-muted-foreground">
                            <span>CID {d.cid.slice(0, 14)}…</span>
                            <span>{d.hash.slice(0, 22)}…</span>
                          </div>
                        </div>
                        <Button size="icon" variant="ghost" onClick={() => { navigator.clipboard.writeText(d.cid); toast.success("CID copied"); }}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history" className="mt-4">
                <Card className="shadow-soft">
                  <CardContent className="p-6">
                    <ol className="relative border-l border-border ml-2 space-y-6">
                      {[...lc.history].reverse().map((h) => (
                        <li key={h.txId} className="pl-6 relative">
                          <span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-accent ring-4 ring-background" />
                          <div className="flex flex-wrap items-baseline gap-x-3">
                            <div className="font-medium text-sm">{h.action}</div>
                            {h.note && <span className="text-xs text-muted-foreground uppercase tracking-wider">{h.note.replace(/_/g, " ")}</span>}
                          </div>
                          <div className="text-xs text-muted-foreground">by {h.actor} · {fmtDT(h.timestamp)}</div>
                          <div className="mt-1 font-mono text-[11px] text-muted-foreground flex items-center gap-1">
                            <ExternalLink className="h-3 w-3" /> {h.txId}
                          </div>
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-4">
            <Card className="shadow-soft">
              <CardHeader><CardTitle className="text-base">Approvals</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <ApprovalRow
                  icon={ShieldCheck}
                  title="Customs"
                  by={lc.customsApprovedBy}
                  at={lc.customsApprovedAt}
                  action={canCustoms ? doCustoms : undefined}
                  actionLabel="Approve as customs"
                  disabledReason={
                    !canCustoms && !lc.customsApprovedAt
                      ? role !== "Customs Officer"
                        ? "Switch role to Customs Officer"
                        : "Documents required first"
                      : undefined
                  }
                />
                <ApprovalRow
                  icon={Landmark}
                  title="Bank"
                  by={lc.bankApprovedBy}
                  at={lc.bankApprovedAt}
                  action={canBank ? doBank : undefined}
                  actionLabel="Approve as bank"
                  disabledReason={
                    !canBank && !lc.bankApprovedAt
                      ? role !== "Bank Officer"
                        ? "Switch role to Bank Officer"
                        : "Documents required first"
                      : undefined
                  }
                />
                {lc.paymentReleasedAt && (
                  <div className="rounded-lg bg-success/15 text-success-foreground p-4 flex items-start gap-3">
                    <Wallet className="h-5 w-5 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium">Payment released</div>
                      <div className="text-xs opacity-80">{fmtDT(lc.paymentReleasedAt)}</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader><CardTitle className="text-base">Quick actions</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link to="/documents/$lcId"
 params={{ lcId: lc.lcId }}>
                    <Ship className="h-4 w-4" /> Upload documents
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link to="/customs/$lcId" params={{ lcId: lc.lcId }}>
                    <ShieldCheck className="h-4 w-4" /> Customs approval
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link to="/bank/$lcId" params={{ lcId: lc.lcId }}>
                    <Landmark className="h-4 w-4" /> Bank approval
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm">{children}</div>
    </div>
  );
}

function ApprovalRow({ icon: Icon, title, by, at, action, actionLabel, disabledReason }: { icon: any; title: string; by?: string; at?: string; action?: () => void; actionLabel: string; disabledReason?: string }) {
  const approved = !!at;
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border border-border">
      <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${approved ? "bg-success/20 text-success-foreground" : "bg-muted text-muted-foreground"}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{title} approval</div>
        {approved ? (
          <div className="text-xs text-muted-foreground">by {by} · {new Date(at!).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</div>
        ) : action ? (
          <Button size="sm" className="mt-2" onClick={action}>{actionLabel}</Button>
        ) : (
          <div className="text-xs text-muted-foreground">{disabledReason || "Pending"}</div>
        )}
      </div>
    </div>
  );
}
