import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useRole } from "@/lib/role-context";
import { useLC, useInvalidateLCs } from "@/lib/use-lcs";
import { lcStore } from "@/lib/lc-store";
import { toast } from "sonner";
import { ArrowLeft, UploadCloud, FileText, CheckCircle2, Info } from "lucide-react";
import { useRef, useState } from "react";
import type { DocType } from "@/lib/lc-types";

export const Route = createFileRoute("/documents/$lcId")({
  head: ({ params }) => ({
    meta: [
      { title: `Upload documents · ${params.lcId}` },
      { name: "description", content: `Exporter uploads invoice and bill of lading for Letter of Credit ${params.lcId}. Files are hashed and pinned to IPFS.` },
      { property: "og:title", content: `Upload documents · ${params.lcId}` },
      { property: "og:description", content: `Upload invoice and bill of lading for ${params.lcId}.` },
    ],
  }),
  component: UploadDocuments,
});

function UploadDocuments() {
  console.log("========== UploadDocuments mounted ==========");
  const { lcId } = Route.useParams();
  const { role } = useRole();
  const lc = useLC(lcId);
  const navigate = useNavigate();
  const invalidate = useInvalidateLCs();
  const inputRef = useRef<HTMLInputElement>(null);
  const [docType, setDocType] = useState<DocType>("invoice");
  const [file, setFile] = useState<File | null>(null);
  const [uploadedBy, setUploadedBy] = useState("exp.demo");

  if (!lc) return <AppShell><div className="p-10 text-sm text-muted-foreground">Loading…</div></AppShell>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role !== "Exporter Company") {
      toast.error("Only Exporter Company can upload documents");
      return;
    }
    if (!file) { toast.error("Select a file first"); return; }
    try {
      await lcStore.uploadDocument(role, lcId, {
        docType,
        file,
        uploadedBy,
      });
      invalidate(lcId);
      toast.success("Document uploaded", { description: `${file.name} pinned to IPFS and recorded on the ledger.` });
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (err: any) { toast.error(err.message); }
  };

  const has = (t: DocType) => lc.documents.some((d) => d.docType === t);

  return (
    <AppShell>
      <div className="p-6 lg:p-10 max-w-4xl mx-auto space-y-6">
        <Link to="/lcs/$lcId" params={{ lcId }} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to {lcId}
        </Link>
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Chaincode · UploadDocument</div>
          <h1 className="text-2xl font-semibold tracking-tight mt-1">Upload documents</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Files are hashed (SHA-256), pinned to IPFS, and the resulting CID is recorded on the ledger. Requires the <span className="font-medium">Exporter Company</span> role.
          </p>
        </div>

        {role !== "Exporter Company" && (
          <div className="rounded-lg border border-warning/40 bg-warning/10 p-4 flex items-start gap-3">
            <Info className="h-5 w-5 mt-0.5" />
            <div className="text-sm">Switch role to <span className="font-medium">Exporter Company</span> from the top-right selector to upload.</div>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <RequirementCard title="Invoice" done={has("invoice")} />
          <RequirementCard title="Bill of Lading" done={has("bill_of_lading")} />
        </div>

        <form onSubmit={submit}>
          <Card className="shadow-soft">
            <CardHeader><CardTitle className="text-base">New document</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="mb-2 block">Document type</Label>
                <RadioGroup value={docType} onValueChange={(v) => setDocType(v as DocType)} className="grid grid-cols-2 gap-3">
                  <label className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer ${docType === "invoice" ? "border-accent bg-accent/5" : "border-border"}`}>
                    <RadioGroupItem value="invoice" />
                    <span className="text-sm font-medium">Invoice</span>
                  </label>
                  <label className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer ${docType === "bill_of_lading" ? "border-accent bg-accent/5" : "border-border"}`}>
                    <RadioGroupItem value="bill_of_lading" />
                    <span className="text-sm font-medium">Bill of Lading</span>
                  </label>
                </RadioGroup>
              </div>

              <div>
                <Label className="mb-2 block">File</Label>
                <label
                  htmlFor="file"
                  className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/30 hover:bg-muted/50 hover:border-accent/60 transition-colors py-10 cursor-pointer"
                >
                  <div className="h-12 w-12 rounded-full bg-accent/15 text-accent flex items-center justify-center">
                    <UploadCloud className="h-6 w-6" />
                  </div>
                  <div className="text-sm font-medium">
                    {file ? file.name : "Click to browse or drop a file"}
                  </div>
                  <div className="text-xs text-muted-foreground">PDF, PNG, JPG — up to 10 MB</div>
                  <input
                    ref={inputRef}
                    id="file"
                    type="file"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>

              <div>
                <Label>Uploaded by</Label>
                <Input className="mt-1.5" value={uploadedBy} onChange={(e) => setUploadedBy(e.target.value)} />
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-end gap-3 mt-4">
            <Button type="button" variant="ghost" onClick={() => navigate({ to: "/lcs/$lcId", params: { lcId } })}>Done</Button>
            <Button type="submit" disabled={role !== "Exporter Company" || !file}>
              <UploadCloud className="h-4 w-4" /> Pin to IPFS & record
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

function RequirementCard({ title, done }: { title: string; done: boolean }) {
  return (
    <Card className={`shadow-soft ${done ? "border-success/50 bg-success/5" : ""}`}>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${done ? "bg-success/20 text-success-foreground" : "bg-muted text-muted-foreground"}`}>
          {done ? <CheckCircle2 className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
        </div>
        <div>
          <div className="font-medium text-sm">{title}</div>
          <div className="text-xs text-muted-foreground">{done ? "Uploaded" : "Required"}</div>
        </div>
      </CardContent>
    </Card>
  );
}
