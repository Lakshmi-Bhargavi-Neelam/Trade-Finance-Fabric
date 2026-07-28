import { createFileRoute } from "@tanstack/react-router";
import { QueueView } from "@/components/QueueView";

export const Route = createFileRoute("/queue/documents")({
  head: () => ({
    meta: [
      { title: "Documents queue · TradeFinance Fabric" },
      { name: "description", content: "Letters of Credit awaiting invoice or bill of lading uploads from the exporter." },
      { property: "og:title", content: "Documents queue · TradeFinance Fabric" },
      { property: "og:description", content: "LCs awaiting exporter document uploads." },
    ],
  }),
  component: () => (
    <QueueView
      title="Documents queue"
      subtitle="Awaiting exporter uploads"
      description="Letters of Credit that still need an invoice or bill of lading before customs and bank can approve."
      filter={(lc) => lc.status === "CREATED" || (lc.status === "DOCUMENTS_UPLOADED" && lc.documents.length < 2)}
      linkTo="documents"
      cta="Upload"
    />
  ),
});
