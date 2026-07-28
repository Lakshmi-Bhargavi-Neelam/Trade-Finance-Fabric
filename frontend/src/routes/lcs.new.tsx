import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useRole } from "@/lib/role-context";
import { lcStore } from "@/lib/lc-store";
import { useInvalidateLCs } from "@/lib/use-lcs";
import { toast } from "sonner";
import { useState } from "react";
import { Info, ArrowLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/lcs/new")({
  head: () => ({
    meta: [
      { title: "Create Letter of Credit · TradeFinance Fabric" },
      { name: "description", content: "Draft and issue a new Letter of Credit on the shared Fabric ledger. Bank Officer signs and creates the LC." },
      { property: "og:title", content: "Create Letter of Credit · TradeFinance Fabric" },
      { property: "og:description", content: "Draft and issue a new Letter of Credit on the shared Fabric ledger." },
    ],
  }),
  component: CreateLC,
});

function CreateLC() {
  const { role } = useRole();
  const navigate = useNavigate();
  const invalidate = useInvalidateLCs();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    importer: "",
    exporter: "",
    importerBank: "Meridian Trust Bank",
    exporterBank: "Hansa Handelsbank",
    amount: "",
    currency: "USD",
    commodity: "",
    quantity: "",
    expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60).toISOString().slice(0, 10),
  });

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role !== "Bank Officer") {
      toast.error("Only Bank Officer can create an LC", { description: "Switch role from the header." });
      return;
    }
    setSubmitting(true);
    try {
      const lc = await lcStore.create(role, {
        importer: form.importer,
        exporter: form.exporter,
        importerBank: form.importerBank,
        exporterBank: form.exporterBank,
        amount: Number(form.amount),
        currency: form.currency,
        commodity: form.commodity,
        quantity: form.quantity,
        expiryDate: new Date(form.expiryDate).toISOString(),
      });
      invalidate();
      toast.success("Letter of Credit created", { description: `${lc.lcId} recorded on the ledger.` });
      navigate({ to: "/lcs/$lcId", params: { lcId: lc.lcId } });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="p-6 lg:p-10 max-w-4xl mx-auto space-y-6">
        <Link to="/lcs" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to all LCs
        </Link>
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Chaincode · CreateLC</div>
          <h1 className="text-2xl font-semibold tracking-tight mt-1">Create Letter of Credit</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Records a new LC on the shared channel. Requires the <span className="font-medium">Bank Officer</span> role.
          </p>
        </div>

        {role !== "Bank Officer" && (
          <div className="rounded-lg border border-warning/40 bg-warning/10 p-4 flex items-start gap-3">
            <Info className="h-5 w-5 text-warning-foreground mt-0.5" />
            <div className="text-sm">
              You're acting as <span className="font-medium">{role}</span>. Only <span className="font-medium">Bank Officer</span> can create LCs — switch role from the top-right selector.
            </div>
          </div>
        )}

        <form onSubmit={submit} className="space-y-6">
          <Card className="shadow-soft">
            <CardHeader><CardTitle className="text-base">Parties</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Field label="Importer company" v={form.importer} onChange={(v) => set("importer", v)} placeholder="Kestrel Textiles Pvt Ltd" required />
              <Field label="Exporter company" v={form.exporter} onChange={(v) => set("exporter", v)} placeholder="Nordwind Cotton GmbH" required />
              <Field label="Importer's bank" v={form.importerBank} onChange={(v) => set("importerBank", v)} required />
              <Field label="Exporter's bank" v={form.exporterBank} onChange={(v) => set("exporterBank", v)} required />
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader><CardTitle className="text-base">Shipment & terms</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label>Commodity description</Label>
                <Textarea
                  className="mt-1.5"
                  rows={2}
                  placeholder="Egyptian long-staple cotton bales, grade A"
                  value={form.commodity}
                  onChange={(e) => set("commodity", e.target.value)}
                  required
                />
              </div>
              <Field label="Quantity" v={form.quantity} onChange={(v) => set("quantity", v)} placeholder="40 metric tons" required />
              <Field label="Amount" v={form.amount} onChange={(v) => set("amount", v)} placeholder="285000" type="number" required />
              <Field label="Currency" v={form.currency} onChange={(v) => set("currency", v)} required />
              <Field label="Expiry date" v={form.expiryDate} onChange={(v) => set("expiryDate", v)} type="date" required />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" asChild>
              <Link to="/lcs">Cancel</Link>
            </Button>
            <Button type="submit" disabled={role !== "Bank Officer" || submitting}>
              {submitting ? "Submitting…" : "Sign & submit to ledger"}
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

function Field({ label, v, onChange, placeholder, type = "text", required }: { label: string; v: string; onChange: (v: string) => void; placeholder?: string; type?: string; required?: boolean }) {
  return (
    <div>
      <Label>{label}</Label>
      <Input className="mt-1.5" value={v} placeholder={placeholder} type={type} required={required} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
