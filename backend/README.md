# Phase 2 — Backend API + IPFS

Express REST API that connects to the Hyperledger Fabric network, stores
trade documents in IPFS, and invokes the `lccc` chaincode.

## Prerequisites

Phase 1 must be complete and working on your machine:

```bash
cd ../network
./scripts/generate.sh
./scripts/start.sh          # starts Fabric peers + IPFS (Kubo)
./scripts/createChannel.sh
./scripts/deployChaincode.sh
./scripts/testWorkflow.sh   # confirms Phase 1 end-to-end
```

You also need **Node.js 18+**.

### Hostname mapping (important)

The Fabric Gateway SDK discovers peer addresses using docker-internal
hostnames (e.g. `peer0.exporterbank.tradefinance.com`). Add these to
your hosts file so endorsement works from the host machine:

**Windows** (`C:\Windows\System32\drivers\etc\hosts`):

```
127.0.0.1 orderer.tradefinance.com
127.0.0.1 peer0.importerbank.tradefinance.com
127.0.0.1 peer0.exporterbank.tradefinance.com
127.0.0.1 peer0.customs.tradefinance.com
```

**Linux / macOS** (`/etc/hosts`): same entries.

## Setup

```bash
cd backend
npm install
cp .env.example .env    # optional — defaults work for local dev
npm start
```

The API listens on **http://localhost:3001**.

## Simulated roles

There is no authentication. Pass the acting role via the `X-Acting-Role`
header (or `actingRole` in JSON body / query string):

| Role | Header value | Fabric org | Allowed actions |
|---|---|---|---|
| Bank Officer | `bank_officer` | Importer's Bank | Create LC, bank approval, read |
| Exporter Company | `exporter_company` | Exporter's Bank | Upload documents, read |
| Customs Officer | `customs_officer` | Customs Authority | Customs approval, read |
| Importer Company | `importer_company` | Importer's Bank | Read only |

## REST API

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/api/health` | — | Fabric + IPFS health |
| GET | `/api/roles` | — | List simulated roles |
| POST | `/api/lcs` | `bank_officer` | Create Letter of Credit |
| GET | `/api/lcs` | any | List all LCs |
| GET | `/api/lcs/:lcId` | any | Get one LC |
| GET | `/api/lcs/:lcId/history` | any | Transaction history |
| POST | `/api/lcs/:lcId/documents` | `exporter_company` | Upload doc to IPFS + ledger |
| POST | `/api/lcs/:lcId/customs-approval` | `customs_officer` | Customs approval |
| POST | `/api/lcs/:lcId/bank-approval` | `bank_officer` | Bank approval |
| GET | `/api/documents/:cid` | any | Download file from IPFS |

### Example: full LC lifecycle via curl

```bash
# 1. Create LC
curl -X POST http://localhost:3001/api/lcs \
  -H "Content-Type: application/json" \
  -H "X-Acting-Role: bank_officer" \
  -d '{"lcId":"LC002","importer":"Acme","exporter":"Global Exports","amount":50000,"currency":"USD"}'

# 2. Upload invoice (multipart)
curl -X POST http://localhost:3001/api/lcs/LC002/documents \
  -H "X-Acting-Role: exporter_company" \
  -F "file=@invoice.pdf" \
  -F "docType=INVOICE" \
  -F "uploadedBy=exporter_user"

# 3. Upload bill of lading
curl -X POST http://localhost:3001/api/lcs/LC002/documents \
  -H "X-Acting-Role: exporter_company" \
  -F "file=@bol.pdf" \
  -F "docType=BILL_OF_LADING" \
  -F "uploadedBy=exporter_user"

# 4. Customs approval
curl -X POST http://localhost:3001/api/lcs/LC002/customs-approval \
  -H "Content-Type: application/json" \
  -H "X-Acting-Role: customs_officer" \
  -d '{"approvedBy":"customs_officer_1"}'

# 5. Bank approval (triggers PAYMENT_RELEASED)
curl -X POST http://localhost:3001/api/lcs/LC002/bank-approval \
  -H "Content-Type: application/json" \
  -H "X-Acting-Role: bank_officer" \
  -d '{"approvedBy":"bank_officer_1"}'

# 6. Verify final state
curl http://localhost:3001/api/lcs/LC002
```

### Automated test

With the backend running:

```bash
npm run test:api
```

This exercises the full lifecycle (create → upload docs → customs → bank →
`PAYMENT_RELEASED`) through the REST API.

## Project layout

```
backend/
├── src/
│   ├── server.js              # Express entry point
│   ├── config/                # Env + org/role mapping
│   ├── fabric/                # Gateway client + LC service
│   ├── ipfs/                  # IPFS upload/download
│   ├── routes/                # REST endpoints
│   ├── middleware/            # Role context + error handler
│   └── utils/                 # File hashing
├── scripts/
│   └── test-api.js            # End-to-end API test
├── .env.example
└── package.json
```

## How it works

1. **Document upload**: file → IPFS (CID) → SHA-256 hash → `UploadDocument` chaincode invoke
2. **Invokes**: signed with the Admin identity of the org mapped to the acting role
3. **Queries**: read through the Importer's Bank gateway (any org would work)
4. **Endorsement**: Fabric Gateway discovers all three peers; hosts file entries map docker hostnames to localhost

## Troubleshooting

| Symptom | Fix |
|---|---|
| `Certificate not found` | Run `network/scripts/generate.sh` |
| `No Fabric gateway for org` | Start network: `network/scripts/start.sh` |
| Endorsement / discovery errors | Add hosts file entries (see above) |
| IPFS connection refused | Ensure `ipfs` container is running (`docker ps`) |
| `Role is not allowed` | Set correct `X-Acting-Role` header |
