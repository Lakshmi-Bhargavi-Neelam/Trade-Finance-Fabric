import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ApprovalPage } from "@/components/ApprovalPage";
import { useLC, useInvalidateLCs } from "@/lib/use-lcs";
import { lcStore } from "@/lib/lc-store";
import { useRole } from "@/lib/role-context";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/customs/$lcId")({
  head: ({ params }) => ({
    meta: [
      { title: `Customs approval · ${params.lcId}` },
      { name: "description", content: `Customs Officer verifies shipment documents for Letter of Credit ${params.lcId} and clears customs on the shared ledger.` },
      { property: "og:title", content: `Customs approval · ${params.lcId}` },
      { property: "og:description", content: `Customs verification for LC ${params.lcId}.` },
    ],
  }),
  component: CustomsApproval,
});

function CustomsApproval() {
  const { lcId } = Route.useParams();
  const lc = useLC(lcId);
  const { role } = useRole();
  const navigate = useNavigate();
  const invalidate = useInvalidateLCs();
  const [officer, setOfficer] = useState("customs.demo");
  if (!lc) return <AppShell><div className="p-10 text-sm text-muted-foreground">Loading…</div></AppShell>;

  const onApprove = async () => {
    try {
      await lcStore.customsApproval(role, lcId, officer);
      invalidate(lcId);
      toast.success("Customs approval recorded on the ledger");
      navigate({ to: "/lcs/$lcId", params: { lcId } });
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <AppShell>
      <ApprovalPage
        lc={lc}
        icon={ShieldCheck}
        role={role}
        expectedRole="Customs Officer"
        title="Customs approval"
        chaincode="CustomsApproval"
        description="The Customs Officer verifies uploaded shipment documents and clears customs on-chain. Both invoice and bill of lading must already be uploaded."
        officer={officer}
        setOfficer={setOfficer}
        approved={lc.customsApprovedAt}
        approvedBy={lc.customsApprovedBy}
        canApprove={role === "Customs Officer" && lc.status !== "CREATED" && !lc.customsApprovedAt}
        onApprove={onApprove}
      />
    </AppShell>
  );
}
