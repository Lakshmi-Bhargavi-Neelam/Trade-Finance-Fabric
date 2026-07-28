import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { useLCs } from "@/lib/use-lcs";
import { ArrowUpRight, FileText, Landmark, ShieldCheck, TrendingUp, Wallet, Ship, Plus } from "lucide-react";
import { useMemo } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · TradeFinance Fabric" },
      { name: "description", content: "Overview of active Letters of Credit, approvals in flight, and payments released across the shared ledger." },
      { property: "og:title", content: "Dashboard · TradeFinance Fabric" },
      { property: "og:description", content: "Overview of active Letters of Credit and lifecycle stages across the shared ledger." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const lcs = useLCs();

  const stats = useMemo(() => {
    const total = lcs.length;
    const active = lcs.filter((l) => l.status !== "PAYMENT_RELEASED").length;
    const released = lcs.filter((l) => l.status === "PAYMENT_RELEASED");
    const volume = lcs.reduce((s, l) => s + l.amount, 0);
    const releasedVolume = released.reduce((s, l) => s + l.amount, 0);
    const awaitingCustoms = lcs.filter((l) => l.status === "DOCUMENTS_UPLOADED" || l.status === "BANK_APPROVED").length;
    const awaitingBank = lcs.filter((l) => l.status === "DOCUMENTS_UPLOADED" || l.status === "CUSTOMS_APPROVED").length;
    return { total, active, released: released.length, volume, releasedVolume, awaitingCustoms, awaitingBank };
  }, [lcs]);

  const recent = lcs.slice(0, 5);
  const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  return (
    <AppShell>
      <div className="p-6 lg:p-10 space-y-8 max-w-[1400px] mx-auto">
        <section className="rounded-2xl gradient-hero shadow-elegant p-8 lg:p-10 text-primary-foreground overflow-hidden relative">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
          <div className="absolute -right-10 bottom-0 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
          <div className="relative">
            <div className="text-xs uppercase tracking-[0.2em] text-primary-foreground/60">Shared ledger overview</div>
            <h1 className="text-3xl lg:text-4xl font-semibold mt-2 max-w-xl">
              Every Letter of Credit, every signature, one immutable trail.
            </h1>
            <p className="mt-3 text-primary-foreground/70 max-w-lg text-sm">
              Trade finance across three organizations — Importer's Bank, Exporter's Bank, and Customs — coordinated on
              a Hyperledger Fabric channel with document integrity anchored in IPFS.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Link to="/lcs/new">
                  <Plus className="h-4 w-4" /> Create Letter of Credit
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="bg-transparent border-white/25 text-primary-foreground hover:bg-white/10 hover:text-primary-foreground">
                <Link to="/lcs">
                  View all LCs <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={FileText} label="Active LCs" value={stats.active.toString()} sub={`${stats.total} total on ledger`} />
          <StatCard icon={TrendingUp} label="Total volume" value={fmt(stats.volume)} sub="Across all statuses" />
          <StatCard icon={ShieldCheck} label="Awaiting customs" value={stats.awaitingCustoms.toString()} sub="Pending verification" />
          <StatCard icon={Wallet} label="Payments released" value={fmt(stats.releasedVolume)} sub={`${stats.released} settled`} />
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Recent Letters of Credit</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">Latest activity across the channel</p>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link to="/lcs">View all <ArrowUpRight className="h-3.5 w-3.5" /></Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-1">
              {recent.length === 0 && (
                <div className="text-sm text-muted-foreground py-8 text-center">No LCs yet. Create the first one.</div>
              )}
              {recent.map((lc) => (
                <Link
                  key={lc.lcId}
                  to="/lcs/$lcId"
                  params={{ lcId: lc.lcId }}
                  className="flex items-center justify-between gap-4 py-3 px-3 -mx-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">{lc.lcId}</span>
                      <StatusBadge status={lc.status} />
                    </div>
                    <div className="mt-1 text-sm font-medium truncate">{lc.commodity}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {lc.importer} → {lc.exporter}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-semibold text-sm">{fmt(lc.amount)}</div>
                    <div className="text-[11px] text-muted-foreground">{lc.currency}</div>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <ActionCard
              icon={Ship}
              title="Upload documents"
              desc="Exporter uploads invoice and bill of lading."
              to="/queue/documents"
            />
            <ActionCard
              icon={ShieldCheck}
              title="Customs approval"
              desc="Verify shipment paperwork and clear customs."
              to="/queue/customs"
              tone="warning"
            />
            <ActionCard
              icon={Landmark}
              title="Bank approval"
              desc="Approve documents and trigger payment release."
              to="/queue/bank"
              tone="info"
            />
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function StatCard({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub: string }) {
  return (
    <Card className="shadow-soft border-border/60">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
            <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
            <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
          </div>
          <div className="h-9 w-9 rounded-lg bg-accent/15 text-accent flex items-center justify-center">
            <Icon className="h-4.5 w-4.5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ActionCard({ icon: Icon, title, desc, to, tone = "accent" }: { icon: any; title: string; desc: string; to: string; tone?: "accent" | "warning" | "info" }) {
  const toneClass = tone === "warning" ? "bg-warning/20 text-warning-foreground" : tone === "info" ? "bg-info/15 text-info" : "bg-accent/15 text-accent";
  return (
    <Link to={to} className="block group">
      <Card className="shadow-soft border-border/60 group-hover:border-accent/50 group-hover:shadow-elegant transition-all">
        <CardContent className="p-5 flex items-start gap-4">
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${toneClass}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-sm">{title}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
          </div>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" />
        </CardContent>
      </Card>
    </Link>
  );
}
