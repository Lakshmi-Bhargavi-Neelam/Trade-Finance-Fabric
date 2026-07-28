import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ApprovalPage } from "@/components/ApprovalPage";
import { useLC, useInvalidateLCs } from "@/lib/use-lcs";
import { lcStore } from "@/lib/lc-store";
import { useRole } from "@/lib/role-context";
import { toast } from "sonner";
import { Landmark } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/bank/$lcId")({
  head: ({ params }) => ({
    meta: [
      { title: `Bank approval · ${params.lcId}` },
      { name: "description", content: `Bank Officer approves documents and triggers automatic payment release for Letter of Credit ${params.lcId}.` },
      { property: "og:title", content: `Bank approval · ${params.lcId}` },
      { property: "og:description", content: `Bank approval for LC ${params.lcId}.` },
    ],
  }),
  component: BankApproval,
});

function BankApproval() {
  const { lcId } = Route.useParams();
  const lc = useLC(lcId);
  const { role } = useRole();
  const navigate = useNavigate();
  const invalidate = useInvalidateLCs();
  const [officer, setOfficer] = useState("bank.demo");
  if (!lc) return <AppShell><div className="p-10 text-sm text-muted-foreground">Loading…</div></AppShell>;

  const onApprove = async () => {
    try {
      const updated = await lcStore.bankApproval(role, lcId, officer);
      invalidate(lcId);
      toast.success("Bank approval recorded", {
        description: updated.status === "PAYMENT_RELEASED" ? "Payment automatically released." : undefined,
      });
      navigate({ to: "/lcs/$lcId", params: { lcId } });
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <AppShell>
      <ApprovalPage
        lc={lc}
        icon={Landmark}
        role={role}
        expectedRole="Bank Officer"
        title="Bank approval"
        chaincode="BankApproval"
        description="The Bank Officer approves shipment documents. When both bank and customs have signed off, the chaincode automatically releases the payment."
        officer={officer}
        setOfficer={setOfficer}
        approved={lc.bankApprovedAt}
        approvedBy={lc.bankApprovedBy}
        canApprove={role === "Bank Officer" && lc.status !== "CREATED" && !lc.bankApprovedAt}
        onApprove={onApprove}
      />
    </AppShell>
  );
}
