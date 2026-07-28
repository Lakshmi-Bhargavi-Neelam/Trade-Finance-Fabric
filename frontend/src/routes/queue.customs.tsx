import { createFileRoute } from "@tanstack/react-router";
import { QueueView } from "@/components/QueueView";

export const Route = createFileRoute("/queue/customs")({
  head: () => ({
    meta: [
      { title: "Customs queue · TradeFinance Fabric" },
      { name: "description", content: "Letters of Credit ready for customs verification and on-chain approval." },
      { property: "og:title", content: "Customs queue · TradeFinance Fabric" },
      { property: "og:description", content: "LCs ready for customs verification." },
    ],
  }),
  component: () => (
    <QueueView
      title="Customs queue"
      subtitle="Awaiting customs verification"
      description="Letters of Credit with documents uploaded, waiting for the Customs Officer to verify the shipment and clear customs."
      filter={(lc) => !lc.customsApprovedAt && lc.status !== "CREATED"}
      linkTo="customs"
      cta="Review"
    />
  ),
});
