export type LCStatus =
  | "CREATED"
  | "DOCUMENTS_UPLOADED"
  | "CUSTOMS_APPROVED"
  | "BANK_APPROVED"
  | "PAYMENT_RELEASED";

export type Role =
  | "Importer Company"
  | "Exporter Company"
  | "Customs Officer"
  | "Bank Officer";

export type DocType = "invoice" | "bill_of_lading";

export interface LCDocument {
  docType: DocType;
  fileName: string;
  cid: string;
  hash: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface LC {
  lcId: string;
  status: LCStatus;
  importer: string;
  exporter: string;
  importerBank: string;
  exporterBank: string;
  amount: number;
  currency: string;
  commodity: string;
  quantity: string;
  issueDate: string;
  expiryDate: string;
  documents: LCDocument[];
  customsApprovedBy?: string;
  customsApprovedAt?: string;
  bankApprovedBy?: string;
  bankApprovedAt?: string;
  paymentReleasedAt?: string;
  history: LCHistoryEntry[];
}

export interface LCHistoryEntry {
  txId: string;
  action: string;
  actor: string;
  timestamp: string;
  note?: string;
}
