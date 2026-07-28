import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { useLCs } from "@/lib/use-lcs";
import { Search, Plus, FileStack } from "lucide-react";
import { useMemo, useState } from "react";
import type { LCStatus } from "@/lib/lc-types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/lcs/")({
  head: () => ({
    meta: [
      { title: "All Letters of Credit · TradeFinance Fabric" },
      { name: "description", content: "Browse and filter every Letter of Credit recorded on the shared ledger, across all lifecycle stages." },
      { property: "og:title", content: "All Letters of Credit · TradeFinance Fabric" },
      { property: "og:description", content: "Browse and filter every Letter of Credit recorded on the shared ledger." },
    ],
  }),
  component: AllLCs,
});

const statuses: (LCStatus | "ALL")[] = ["ALL", "CREATED", "DOCUMENTS_UPLOADED", "CUSTOMS_APPROVED", "BANK_APPROVED", "PAYMENT_RELEASED"];

function AllLCs() {
  const lcs = useLCs();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<LCStatus | "ALL">("ALL");

  const filtered = useMemo(() => {
    return lcs.filter((lc) => {
      if (status !== "ALL" && lc.status !== status) return false;
      if (!q) return true;
      const s = q.toLowerCase();
      return (
        lc.lcId.toLowerCase().includes(s) ||
        lc.importer.toLowerCase().includes(s) ||
        lc.exporter.toLowerCase().includes(s) ||
        lc.commodity.toLowerCase().includes(s)
      );
    });
  }, [lcs, q, status]);

  const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  return (
    <AppShell>
      <div className="p-6 lg:p-10 max-w-[1400px] mx-auto space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Ledger</div>
            <h1 className="text-2xl font-semibold tracking-tight mt-1">All Letters of Credit</h1>
            <p className="text-sm text-muted-foreground mt-1">{filtered.length} of {lcs.length} shown</p>
          </div>
          <Button asChild>
            <Link to="/lcs/new"><Plus className="h-4 w-4" /> New LC</Link>
          </Button>
        </div>

        <Card className="shadow-soft">
          <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by LC ID, importer, exporter, or commodity…"
                className="pl-9"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <Select value={status} onValueChange={(v) => setStatus(v as LCStatus | "ALL")}>
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s === "ALL" ? "All statuses" : s.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr className="text-left">
                  <th className="px-5 py-3 font-medium">LC ID</th>
                  <th className="px-5 py-3 font-medium">Parties</th>
                  <th className="px-5 py-3 font-medium">Commodity</th>
                  <th className="px-5 py-3 font-medium text-right">Amount</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-muted-foreground">
                      <FileStack className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      No Letters of Credit match your filters.
                    </td>
                  </tr>
                )}
                {filtered.map((lc) => (
                  <tr key={lc.lcId} className="border-t border-border hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-4 font-mono text-xs">{lc.lcId}</td>
                    <td className="px-5 py-4">
                      <div className="text-xs text-muted-foreground">Importer</div>
                      <div className="font-medium">{lc.importer}</div>
                      <div className="text-xs text-muted-foreground mt-1">Exporter</div>
                      <div className="text-xs">{lc.exporter}</div>
                    </td>
                    <td className="px-5 py-4 max-w-[280px]">
                      <div className="truncate">{lc.commodity}</div>
                      <div className="text-xs text-muted-foreground">{lc.quantity}</div>
                    </td>
                    <td className="px-5 py-4 text-right font-semibold whitespace-nowrap">{fmt(lc.amount)}</td>
                    <td className="px-5 py-4"><StatusBadge status={lc.status} /></td>
                    <td className="px-5 py-4 text-right">
                      <Button asChild size="sm" variant="ghost">
                        <Link to="/lcs/$lcId" params={{ lcId: lc.lcId }}>Open</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
