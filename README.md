# Trade Finance Fabric

A permissioned blockchain-based trade finance platform built using **Hyperledger Fabric**, **Go Chaincode**, **Express.js**, **React**, and **IPFS** to improve transparency, traceability, and document management in cross-border trade transactions.

---

# Overview

International trade involves multiple organizations such as importers, exporters, banks, and customs authorities. Since these organizations do not fully trust each other, they rely on a **Letter of Credit (LC)** issued by the importer's bank to guarantee payment.

In the traditional process, shipment documents are exchanged between multiple parties through centralized systems, emails, or paper documents. This often leads to:

- Lack of transparency
- Difficulty tracking document status
- Limited auditability
- Risk of document tampering
- Slow approval workflows

This project demonstrates how a **permissioned blockchain** can improve visibility and trust while maintaining a shared, immutable record of every trade transaction.

---

# Problem Statement

Cross-border trade requires coordination between multiple independent organizations:

- Importer Company
- Exporter Company
- Importer's Bank
- Exporter's Bank
- Customs Authority

Each participant maintains its own records, making it difficult to ensure everyone is working with the same information.

Document verification is also time-consuming because every participant must verify documents independently before approving the next stage of the trade process.

---

# Our Approach

This project digitizes the Letter of Credit workflow using Hyperledger Fabric.

Instead of maintaining separate records across organizations, every participant accesses a shared permissioned ledger where the latest state of the trade is visible.

Large shipment documents are stored in **IPFS**, while only their metadata (CID, file hash, timestamps, uploader information) is stored on the blockchain.

Business rules such as:

- LC creation
- Document upload
- Customs approval
- Bank approval
- Automatic payment release

are implemented inside Hyperledger Fabric chaincode.

---

# Technology Stack

## Frontend

- React
- TypeScript
- TanStack Router
- TanStack Query
- Tailwind CSS

## Backend

- Node.js
- Express.js
- Hyperledger Fabric Gateway SDK
- Multer
- IPFS HTTP Client

## Blockchain

- Hyperledger Fabric
- Go Chaincode
- CouchDB World State

## Distributed Storage

- IPFS

---

# System Architecture

```
                    React Frontend
                           │
                           │ REST APIs
                           ▼
                  Express.js Backend
                           │
        ┌──────────────────┴──────────────────┐
        │                                     │
        ▼                                     ▼
 Hyperledger Fabric Gateway              IPFS Node
        │
        ▼
 Hyperledger Fabric Network
        │
        ▼
      Chaincode
        │
        ├────────► World State (Latest Asset State)
        │
        └────────► Blockchain Ledger (Complete Transaction History)
```

---

# Workflow

## 1. Create Letter of Credit

The Bank Officer creates a new Letter of Credit containing:

- Importer
- Exporter
- Importer's Bank
- Exporter's Bank
- Commodity
- Quantity
- Amount
- Currency
- Expiry Date

The backend invokes the chaincode's `CreateLC()` function, which stores the asset in the blockchain.

Status:

```
CREATED
```

---

## 2. Upload Shipment Documents

The Exporter uploads:

- Commercial Invoice
- Bill of Lading

The backend:

- uploads the file to IPFS
- generates the file hash
- stores only the document metadata on the blockchain

Status:

```
DOCUMENTS_UPLOADED
```

---

## 3. Customs Approval

The Customs Officer reviews the shipment documents.

If approved:

- approval information is recorded on-chain
- status becomes

```
CUSTOMS_APPROVED
```

---

## 4. Bank Approval

The Importer's Bank verifies the shipment documents.

If approved:

- approval details are stored on-chain
- status becomes

```
BANK_APPROVED
```

---

## 5. Automatic Payment Release

When both:

- Customs Approval
- Bank Approval

are completed, the chaincode automatically updates the Letter of Credit to:

```
PAYMENT_RELEASED
```

No additional transaction is required for payment release.

---

# Smart Contract (Chaincode)

The business logic is implemented inside Go chaincode.

Implemented functions include:

- CreateLC()
- GetLC()
- GetAllLCs()
- UploadDocument()
- CustomsApproval()
- BankApproval()
- GetLCHistory()
- GetStatus()

These functions ensure that all participants follow the same business rules.

---

# REST APIs

The Express backend exposes REST APIs for the frontend.

Implemented endpoints include:

```
POST   /api/lcs

GET    /api/lcs

GET    /api/lcs/:id

POST   /api/lcs/:id/documents

POST   /api/lcs/:id/customs-approval

POST   /api/lcs/:id/bank-approval

GET    /api/lcs/:id/history
```

The backend communicates with Hyperledger Fabric using the Fabric Gateway SDK.

---

# Why Hyperledger Fabric?

This project uses Hyperledger Fabric because international trade involves known organizations rather than anonymous participants.

Advantages include:

- Permissioned network
- Identity-based access
- Shared ledger among trusted organizations
- Immutable transaction history
- Fine-grained business logic through chaincode
- High throughput
- No cryptocurrency or gas fees

---

# Why IPFS?

Shipment documents can be large.

Instead of storing entire files on the blockchain, this project stores only:

- IPFS Content Identifier (CID)
- SHA-256 hash
- Upload metadata

Benefits:

- Smaller blockchain size
- Faster transactions
- File integrity verification
- Distributed document storage

---

# Key Features

- Permissioned blockchain network
- Digital Letter of Credit workflow
- Shared ledger for all participants
- Immutable transaction history
- IPFS-based document storage
- Automatic workflow progression
- REST API integration
- React dashboard
- Asset history tracking

---

# Benefits for Cross-Border Trade

This approach improves trade operations by providing:

### Transparency

Every participant sees the same Letter of Credit status.

### Traceability

Every transaction is permanently recorded on the blockchain.

### Data Integrity

Shipment documents can be verified using stored cryptographic hashes.

### Shared Source of Truth

All organizations work from the same ledger rather than maintaining separate records.

### Auditability

Complete transaction history can be retrieved at any time.

### Reduced Manual Coordination

Organizations no longer need to exchange status updates through multiple communication channels.

---

# Current Limitations

This project is an MVP intended to demonstrate blockchain-based trade finance.

The following are not currently implemented:

- Digital signatures
- Identity-based MSP authorization
- Multi-organization endorsement policies
- Automatic customs integration
- Bank payment integration
- Real-time shipment tracking
- Smart document verification
- Notification services

---

# Future Enhancements

Potential improvements include:

- MSP-based role authorization
- Integration with real banking systems
- Digital signature verification
- Automated customs system integration
- IoT-based shipment tracking
- OCR-based document validation
- Notification services
- Multi-currency settlement
- Rich CouchDB queries
- Pagination and search
- Kubernetes deployment
- Monitoring and analytics dashboard

---

# Project Outcome

This project demonstrates how Hyperledger Fabric can digitize a traditional Letter of Credit workflow by combining:

- Permissioned blockchain
- Smart contracts
- Distributed file storage
- REST APIs
- Modern web technologies

The result is a transparent, traceable, and auditable trade finance system where all participating organizations share a common, immutable view of the transaction lifecycle.

---
