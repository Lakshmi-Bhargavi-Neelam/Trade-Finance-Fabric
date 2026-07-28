# Scope

## Goal

Demonstrate core enterprise-blockchain concepts — multi-org shared
ledger, smart contracts, document integrity via IPFS, and workflow
automation — through a simplified Letter of Credit (LC) lifecycle.

## Organizations

1. Importer's Bank
2. Exporter's Bank
3. Customs Authority

Each with one peer, on a shared channel (`tradefinancechannel`).

## Simulated user roles (no auth)

- Importer Company
- Exporter Company
- Customs Officer
- Bank Officer

The frontend (Phase 3) will let the user pick a role from a dropdown;
there is no login, session, or identity verification tying a browser
session to a specific Fabric identity. Every transaction is signed with
one of a small set of pre-generated Fabric identities that the backend
holds, chosen based on which "org" the acting role belongs to.

## LC lifecycle

```
CREATED
  │  (Bank Officer: CreateLC)
  ▼
DOCUMENTS_UPLOADED
  │  (Exporter: UploadDocument x2 — invoice + bill of lading)
  ▼
CUSTOMS_APPROVED  ──┐
  │ (Customs        │
  │  Officer)        │  both required, either order
BANK_APPROVED  ──────┘
  │ (Bank Officer)
  ▼
PAYMENT_RELEASED   (automatic, once both approvals exist)
```

## Explicitly out of scope

Per the original spec, this MVP does **not** implement:

- Authentication / authorization / JWT / OAuth
- Email notifications
- OCR or AI document analysis
- Real payment gateways, banking APIs, customs APIs, shipping APIs
- Docker/Kubernetes orchestration beyond what Fabric itself requires
- Microservices or event-driven architecture
- Advanced security hardening (rate limiting, WAF, secrets management, etc.)

These are reasonable next steps for a real system, but adding them here
would work against the goal of a simple, educational MVP.
