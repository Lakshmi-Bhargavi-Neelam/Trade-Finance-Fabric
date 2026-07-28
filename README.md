# Trade Finance / Letter of Credit Platform (MVP)

An educational Hyperledger Fabric project demonstrating a multi-org
enterprise blockchain workflow for Letters of Credit (LC), with document
integrity backed by IPFS.

This is **not** a production banking system. Scope is deliberately
minimal — see `docs/SCOPE.md`.

## Status

- [x] **Phase 1 — Fabric network + chaincode**
- [x] **Phase 2 — Backend APIs + IPFS integration**
- [ ] Phase 3 — React frontend

Phase 3 will be built after Phase 2 is confirmed working end-to-end
on your machine — per the incremental development approach in the spec.

## Architecture (Phase 1 + 2)

Three organizations, one peer each, one Raft orderer, one channel, plus IPFS:

| Organization | MSP ID | Peer | CouchDB |
|---|---|---|---|
| Importer's Bank | `ImporterBankOrgMSP` | peer0.importerbank.tradefinance.com:7051 | localhost:5984 |
| Exporter's Bank | `ExporterBankOrgMSP` | peer0.exporterbank.tradefinance.com:9051 | localhost:7984 |
| Customs Authority | `CustomsOrgMSP` | peer0.customs.tradefinance.com:11051 | localhost:9984 |

Channel: `tradefinancechannel`
Chaincode: `lccc` (Go, in `chaincode/lc-chaincode`)
IPFS: Kubo node on `localhost:5001` (API) / `8080` (gateway)
Backend API: Express on `localhost:3001` (see `backend/README.md`)

## Repository layout

```
trade-finance-fabric/
├── network/                 # Fabric network config + docker-compose + scripts
│   ├── crypto-config.yaml
│   ├── configtx.yaml
│   ├── docker-compose.yaml
│   └── scripts/
│       ├── generate.sh      # cryptogen + configtxgen
│       ├── start.sh         # docker-compose up
│       ├── createChannel.sh # create channel + join all 3 peers
│       ├── deployChaincode.sh
│       ├── testWorkflow.sh  # exercises the full LC lifecycle via peer CLI
│       └── stop.sh
├── chaincode/
│   └── lc-chaincode/        # Go chaincode implementing the LC contract
├── backend/                 # Phase 2 — Express API + Fabric Gateway + IPFS
│   └── README.md            # How to run Phase 2
├── frontend/                # (Phase 3)
└── docs/
    └── SCOPE.md
```

## Prerequisites

You'll need these installed on your own machine (they are **not**
available in the environment this repo was drafted in, so none of the
network/chaincode-deployment steps below have been executed for you —
only the Go syntax and YAML configs have been validated):

- Docker + Docker Compose
- Go 1.20+
- Node.js 18+ (Phase 2 backend)
- Hyperledger Fabric binaries and Docker images (`cryptogen`,
  `configtxgen`, `peer`), obtained via Fabric's bootstrap script:
  ```
  curl -sSL https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/bootstrap.sh | bash -s -- 2.5.4 1.5.7
  ```
  Add the resulting `bin/` folder to your `PATH`.

## How to run Phase 1

```bash
cd network

# 1. Generate crypto material + channel artifacts
./scripts/generate.sh

# 2. Start the network (orderer, 3 peers, 3 CouchDB, cli)
./scripts/start.sh

# 3. Create the channel and join all three peers
./scripts/createChannel.sh

# 4. Package, install, approve, and commit the chaincode
#    (this also runs `go mod vendor` inside the CLI container, which
#    needs normal internet access to resolve fabric-contract-api-go)
./scripts/deployChaincode.sh

# 5. Exercise the full LC lifecycle end-to-end
./scripts/testWorkflow.sh
```

`testWorkflow.sh` creates an LC, uploads both documents, approves it via
customs and the bank, and confirms the LC automatically flips to
`PAYMENT_RELEASED`. If that script runs clean, Phase 1 is done and we
move to Phase 2.

To tear everything down: `./scripts/stop.sh`

## How to run Phase 2

After Phase 1 (`testWorkflow.sh`) passes:

1. Add docker peer hostnames to your hosts file (see `backend/README.md`).
2. Start the backend:

```bash
cd backend
npm install
npm start
```

3. Run the automated API test (in another terminal):

```bash
cd backend
npm run test:api
```

Success: final LC status is `PAYMENT_RELEASED` with real IPFS CIDs on the ledger.

See `backend/README.md` for the full REST API reference and curl examples.

### A note on this environment

The chaincode's Go syntax was verified here with `gofmt`/`go vet` after
installing Go via `apt`, and all YAML/shell files were syntax-checked.
Full dependency resolution (`go mod tidy`), Docker, and the Fabric
binaries themselves aren't available in this sandbox (network egress is
restricted and Docker isn't installed), so the network has not actually
been brought up and tested end-to-end here — that needs to happen on
your machine using the steps above.

## Chaincode functions

| Function | Caller (typical) | Description |
|---|---|---|
| `CreateLC` | Bank Officer | Opens a new LC |
| `GetLC` | anyone | Reads one LC by ID |
| `GetAllLCs` | anyone | Lists all LCs |
| `UploadDocument` | Exporter | Records IPFS CID + hash for invoice or bill of lading |
| `CustomsApproval` | Customs Officer | Marks shipment verified |
| `BankApproval` | Bank Officer | Marks documents approved |
| `GetLCHistory` | anyone | Full change history for one LC |

`CustomsApproval` and `BankApproval` both require that both documents
have already been uploaded. Once **both** approvals are in place, the
chaincode automatically sets `paymentReleased = true` and
`status = PAYMENT_RELEASED` — no separate transaction needed.

See `docs/SCOPE.md` for the full LC lifecycle and what's intentionally
out of scope for this MVP.
