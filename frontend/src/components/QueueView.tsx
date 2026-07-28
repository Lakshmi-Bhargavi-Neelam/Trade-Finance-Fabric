import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { useLCs } from "@/lib/use-lcs";
import type { LC } from "@/lib/lc-types";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, ArrowUpRight } from "lucide-react";

interface Props {
  title: string;
  subtitle: string;
  description: string;
  filter: (lc: LC) => boolean;
  linkTo: "documents" | "customs" | "bank";
  cta: string;
}

export function QueueView({ title, subtitle, description, filter, linkTo, cta }: Props) {
  const all = useLCs();
  const items = all.filter(filter);
  const fmt = (n: number, c: string) => new Intl.NumberFormat("en-US", { style: "currency", currency: c, maximumFractionDigits: 0 }).format(n);

  return (
    <AppShell>
      <div className="p-6 lg:p-10 max-w-[1200px] mx-auto space-y-6">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{subtitle}</div>
          <h1 className="text-2xl font-semibold tracking-tight mt-1">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{description}</p>
        </div>

        {items.length === 0 ? (
          <Card className="shadow-soft">
            <CardContent className="p-12 text-center">
              <div className="h-14 w-14 mx-auto rounded-full bg-success/15 text-success-foreground flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h2 className="mt-4 font-medium">Queue is clear</h2>
              <p className="text-sm text-muted-foreground mt-1">No Letters of Credit are waiting on this step.</p>
              <Button asChild variant="outline" className="mt-6"><Link to="/lcs">Browse all LCs</Link></Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {items.map((lc) => (
              <Card key={lc.lcId} className="shadow-soft hover:shadow-elegant transition-shadow">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">{lc.lcId}</span>
                        <StatusBadge status={lc.status} />
                      </div>
                      <div className="font-medium mt-2">{lc.commodity}</div>
                      <div className="text-xs text-muted-foreground">{lc.importer} → {lc.exporter}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold">{fmt(lc.amount, lc.currency)}</div>
                      <div className="text-[11px] text-muted-foreground">{lc.documents.length}/2 docs</div>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button asChild size="sm" variant="ghost" className="flex-1">
                      <Link to="/lcs/$lcId" params={{ lcId: lc.lcId }}>
                        Details <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                    <Button asChild size="sm" className="flex-1">
                      {linkTo === "documents" ? (
                        <Link to="/documents/$lcId"
 params={{ lcId: lc.lcId }}>{cta}</Link>
                      ) : linkTo === "customs" ? (
                        <Link to="/customs/$lcId" params={{ lcId: lc.lcId }}>{cta}</Link>
                      ) : (
                        <Link to="/bank/$lcId" params={{ lcId: lc.lcId }}>{cta}</Link>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
