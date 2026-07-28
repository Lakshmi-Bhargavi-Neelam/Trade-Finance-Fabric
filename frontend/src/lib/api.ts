// Thin HTTP client for the Express + Fabric backend.
// Configure the base URL with VITE_API_URL (defaults to the backend's dev port).
import type { LC, LCDocument, LCHistoryEntry, LCStatus, Role, DocType } from "./lc-types";

export const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ||
  "http://localhost:3001/api";

// --- Role mapping (UI label -> backend role key) --------------------------
const ROLE_KEY: Record<Role, string> = {
  "Bank Officer": "bank_officer",
  "Exporter Company": "exporter_company",
  "Customs Officer": "customs_officer",
  "Importer Company": "importer_company",
};

function roleKey(role: Role): string {
  return ROLE_KEY[role] ?? "bank_officer";
}

// --- Doc type mapping (UI lower_snake <-> backend UPPER_SNAKE) ------------
const DOC_TO_BACKEND: Record<DocType, "INVOICE" | "BILL_OF_LADING"> = {
  invoice: "INVOICE",
  bill_of_lading: "BILL_OF_LADING",
};

function docTypeFromBackend(v?: string): DocType {
  return v === "INVOICE" ? "invoice" : "bill_of_lading";
}

// --- Fetch helper ---------------------------------------------------------
interface RequestOptions {
  role?: Role;
  body?: unknown;
  formData?: FormData;
  method?: string;
}

async function apiFetch<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (opts.role) headers["X-Acting-Role"] = roleKey(opts.role);

  let body: BodyInit | undefined;
  if (opts.formData) {
    body = opts.formData;
  } else if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.body);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: opts.method ?? (body ? "POST" : "GET"),
    headers,
    body,
  });

  const text = await res.text();
  let data: any = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const message =
      (data && typeof data === "object" && (data.error || data.message)) ||
      (typeof data === "string" && data) ||
      `${opts.method ?? "GET"} ${path} failed (${res.status})`;
    throw new Error(message);
  }

  return data as T;
}

// --- Backend types --------------------------------------------------------
interface BackendDocument {
  cid: string;
  fileName: string;
  fileHash: string;
  docType: string;
  uploadedBy: string;
  uploadedAt: string;
}

interface BackendLC {
  lcId: string;
  importer: string;
  exporter: string;
  importerBank: string;
  exporterBank: string;
  commodity: string;
  quantity: string;
  amount: number;
  currency: string;
  
  expiryDate: string;
  status: LCStatus;
  invoiceDocument?: BackendDocument | null;
  billOfLadingDocument?: BackendDocument | null;
  customsApproved?: boolean;
  customsApprovedBy?: string;
  customsApprovedAt?: string;
  bankApproved?: boolean;
  bankApprovedBy?: string;
  bankApprovedAt?: string;
  paymentReleased?: boolean;
  paymentReleasedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface BackendHistoryEntry {
  txId: string;
  timestamp: string;
  isDelete: boolean;
  lc?: BackendLC | null;
}

// --- Mapping helpers ------------------------------------------------------
function mapDoc(d: BackendDocument): LCDocument {
  return {
    docType: docTypeFromBackend(d.docType),
    fileName: d.fileName,
    cid: d.cid,
    hash: d.fileHash,
    uploadedBy: d.uploadedBy,
    uploadedAt: d.uploadedAt,
  };
}

export function mapLC(b: BackendLC): LC {
  const documents: LCDocument[] = [];
  if (b.invoiceDocument) documents.push(mapDoc(b.invoiceDocument));
  if (b.billOfLadingDocument) documents.push(mapDoc(b.billOfLadingDocument));

  // Backend does not persist these UI-only fields yet; provide sensible defaults.
  const issueDate = b.createdAt;

  return {
    lcId: b.lcId,
    status: b.status,
    importer: b.importer,
    exporter: b.exporter,
    importerBank: b.importerBank,
    exporterBank: b.exporterBank,
    amount: Number(b.amount) || 0,
    currency: b.currency || "USD",
    commodity: b.commodity,
    quantity: b.quantity,
    issueDate,
    expiryDate: b.expiryDate,
    documents,
    customsApprovedBy: b.customsApprovedBy,
    customsApprovedAt: b.customsApprovedAt,
    bankApprovedBy: b.bankApprovedBy,
    bankApprovedAt: b.bankApprovedAt,
    paymentReleasedAt: b.paymentReleasedAt,
    history: [],
  };
}

// Derive a friendly history log by diffing consecutive on-chain snapshots.
export function deriveHistory(raw: BackendHistoryEntry[]): LCHistoryEntry[] {
  // Backend returns newest→oldest; iterate oldest→newest to diff.
  const ordered = [...raw].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const out: LCHistoryEntry[] = [];
  let prev: BackendLC | null = null;

  for (const entry of ordered) {
    const lc = entry.lc ?? null;
    if (!lc) continue;

    if (!prev) {
      out.push({
        txId: entry.txId,
        timestamp: entry.timestamp,
        action: "CreateLC",
        actor: lc.importerBank || "bank_officer",
      });
    } else {
      // Detect doc uploads
      const prevInv = prev.invoiceDocument?.cid;
      const prevBol = prev.billOfLadingDocument?.cid;
      const nowInv = lc.invoiceDocument?.cid;
      const nowBol = lc.billOfLadingDocument?.cid;
      if (nowInv && nowInv !== prevInv) {
        out.push({
          txId: entry.txId,
          timestamp: entry.timestamp,
          action: "UploadDocument",
          actor: lc.invoiceDocument?.uploadedBy || "exporter",
          note: "invoice",
        });
      } else if (nowBol && nowBol !== prevBol) {
        out.push({
          txId: entry.txId,
          timestamp: entry.timestamp,
          action: "UploadDocument",
          actor: lc.billOfLadingDocument?.uploadedBy || "exporter",
          note: "bill_of_lading",
        });
      } else if (lc.customsApproved && !prev.customsApproved) {
        out.push({
          txId: entry.txId,
          timestamp: entry.timestamp,
          action: "CustomsApproval",
          actor: lc.customsApprovedBy || "customs_officer",
        });
        if (lc.paymentReleased && !prev.paymentReleased) {
          out.push({
            txId: entry.txId + ":pay",
            timestamp: lc.paymentReleasedAt || entry.timestamp,
            action: "PaymentReleased",
            actor: "chaincode",
          });
        }
      } else if (lc.bankApproved && !prev.bankApproved) {
        out.push({
          txId: entry.txId,
          timestamp: entry.timestamp,
          action: "BankApproval",
          actor: lc.bankApprovedBy || "bank_officer",
        });
        if (lc.paymentReleased && !prev.paymentReleased) {
          out.push({
            txId: entry.txId + ":pay",
            timestamp: lc.paymentReleasedAt || entry.timestamp,
            action: "PaymentReleased",
            actor: "chaincode",
          });
        }
      } else if (lc.paymentReleased && !prev.paymentReleased) {
        out.push({
          txId: entry.txId,
          timestamp: lc.paymentReleasedAt || entry.timestamp,
          action: "PaymentReleased",
          actor: "chaincode",
        });
      }
    }
    prev = lc;
  }

  return out;
}

// --- API surface ----------------------------------------------------------
export const api = {
  async listLCs(): Promise<LC[]> {
    const data = await apiFetch<{ lcs: BackendLC[] }>("/lcs");
    return (data.lcs ?? []).map(mapLC);
  },
  async getLC(lcId: string): Promise<LC> {
    const data = await apiFetch<{ lc: BackendLC }>(`/lcs/${encodeURIComponent(lcId)}`);
    return mapLC(data.lc);
  },
  async getHistory(lcId: string): Promise<LCHistoryEntry[]> {
    const data = await apiFetch<{ history: BackendHistoryEntry[] }>(
      `/lcs/${encodeURIComponent(lcId)}/history`,
    );
    return deriveHistory(data.history ?? []);
  },
  async createLC(
    role: Role,
    input: {
      lcId: string;
      importer: string;
      exporter: string;
      importerBank: string;
      exporterBank: string;
      commodity: string;
      quantity: string;
      amount: number;
      currency: string;
      expiryDate: string;
    },
  ): Promise<LC> {
    const data = await apiFetch<{ lc: BackendLC }>("/lcs", {
      role,
      method: "POST",
      body: input,
    });
    return mapLC(data.lc);
  },
  async uploadDocument(
    role: Role,
    lcId: string,
    input: { docType: DocType; file: File; uploadedBy: string },
  ): Promise<LC> {
    const fd = new FormData();
    fd.append("file", input.file, input.file.name);
    fd.append("docType", DOC_TO_BACKEND[input.docType]);
    fd.append("uploadedBy", input.uploadedBy);
    const data = await apiFetch<{ lc: BackendLC }>(
      `/lcs/${encodeURIComponent(lcId)}/documents`,
      { role, method: "POST", formData: fd },
    );
    return mapLC(data.lc);
  },
  async customsApproval(role: Role, lcId: string, approvedBy: string): Promise<LC> {
    const data = await apiFetch<{ lc: BackendLC }>(
      `/lcs/${encodeURIComponent(lcId)}/customs-approval`,
      { role, method: "POST", body: { approvedBy } },
    );
    return mapLC(data.lc);
  },
  async bankApproval(role: Role, lcId: string, approvedBy: string): Promise<LC> {
    const data = await apiFetch<{ lc: BackendLC }>(
      `/lcs/${encodeURIComponent(lcId)}/bank-approval`,
      { role, method: "POST", body: { approvedBy } },
    );
    return mapLC(data.lc);
  },
};

export function newLCId(): string {
  const n = Math.floor(Math.random() * 9000 + 1000);
  return `LC-${new Date().getFullYear()}-${n}`;
}
