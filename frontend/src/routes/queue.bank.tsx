import { createFileRoute } from "@tanstack/react-router";
import { QueueView } from "@/components/QueueView";

export const Route = createFileRoute("/queue/bank")({
  head: () => ({
    meta: [
      { title: "Bank queue · TradeFinance Fabric" },
      { name: "description", content: "Letters of Credit ready for bank approval and automatic payment release." },
      { property: "og:title", content: "Bank queue · TradeFinance Fabric" },
      { property: "og:description", content: "LCs ready for bank approval." },
    ],
  }),
  component: () => (
    <QueueView
      title="Bank queue"
      subtitle="Awaiting bank approval"
      description="Letters of Credit with documents uploaded, waiting for the Bank Officer to approve and trigger payment release."
      filter={(lc) => !lc.bankApprovedAt && lc.status !== "CREATED"}
      linkTo="bank"
      cta="Approve"
    />
  ),
});
