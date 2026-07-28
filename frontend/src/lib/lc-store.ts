// Facade over the real backend API. The public surface (statusMeta, ROLES,
// and the lcStore method names) is preserved so components don't need to
// change; internally every call now hits the Express + Fabric backend.
import { api, newLCId } from "./api";
import type { LC, LCStatus, Role, DocType } from "./lc-types";

export const lcStore = {
  list(): Promise<LC[]> {
    return api.listLCs();
  },
  get(id: string): Promise<LC> {
    return api.getLC(id);
  },
  history(id: string) {
    return api.getHistory(id);
  },
  create(
    role: Role,
    input: {
      importer: string;
      exporter: string;
      importerBank: string;
      exporterBank: string;
      amount: number;
      currency: string;
      // UI-only fields (not persisted by the current chaincode) — accepted for
      // backwards compatibility with existing forms.
      commodity?: string;
      quantity?: string;
      expiryDate?: string;
    },
  ): Promise<LC> {
    if (role !== "Bank Officer") throw new Error("Only Bank Officer can create LCs");
    return api.createLC(role, {
      lcId: newLCId(),
      importer: input.importer,
      exporter: input.exporter,
      importerBank: input.importerBank,
      exporterBank: input.exporterBank,
      commodity: input.commodity ?? "",
  quantity: input.quantity ?? "",
      amount: input.amount,
      currency: input.currency,
       expiryDate: input.expiryDate ?? "",
    });
  },
  uploadDocument(
    role: Role,
    lcId: string,
    doc: { docType: DocType; file: File; uploadedBy: string },
  ): Promise<LC> {
    if (role !== "Exporter Company")
      throw new Error("Only Exporter Company can upload documents");
    return api.uploadDocument(role, lcId, doc);
  },
  customsApproval(role: Role, lcId: string, approvedBy: string): Promise<LC> {
    if (role !== "Customs Officer") throw new Error("Only Customs Officer can approve");
    return api.customsApproval(role, lcId, approvedBy);
  },
  bankApproval(role: Role, lcId: string, approvedBy: string): Promise<LC> {
    if (role !== "Bank Officer") throw new Error("Only Bank Officer can approve");
    return api.bankApproval(role, lcId, approvedBy);
  },
};

export const statusMeta: Record<LCStatus, { label: string; tone: string }> = {
  CREATED: { label: "Created", tone: "bg-muted text-muted-foreground" },
  DOCUMENTS_UPLOADED: { label: "Documents Uploaded", tone: "bg-info/15 text-info" },
  CUSTOMS_APPROVED: { label: "Customs Approved", tone: "bg-warning/20 text-warning-foreground" },
  BANK_APPROVED: { label: "Bank Approved", tone: "bg-warning/20 text-warning-foreground" },
  PAYMENT_RELEASED: { label: "Payment Released", tone: "bg-success/20 text-success-foreground" },
};

export const ROLES: Role[] = [
  "Bank Officer",
  "Exporter Company",
  "Customs Officer",
  "Importer Company",
];
