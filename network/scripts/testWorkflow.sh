#!/bin/bash
# testWorkflow.sh
#
# Exercises the full LC lifecycle directly through `peer chaincode
# invoke/query`, so you can confirm Phase 1 (network + chaincode) works
# end-to-end before building the backend in Phase 2.
set -euo pipefail

CHANNEL_NAME=tradefinancechannel
CC_NAME=lccc
ORDERER_ADDR=orderer.tradefinance.com:7050
ORDERER_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/orderer.tradefinance.com/orderers/orderer.tradefinance.com/tls/ca.crt
CRYPTO=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto

importer_env=(
  -e CORE_PEER_LOCALMSPID=ImporterBankOrgMSP
  -e CORE_PEER_ADDRESS=peer0.importerbank.tradefinance.com:7051
  -e CORE_PEER_MSPCONFIGPATH=$CRYPTO/peerOrganizations/importerbank.tradefinance.com/users/Admin@importerbank.tradefinance.com/msp
  -e CORE_PEER_TLS_ROOTCERT_FILE=$CRYPTO/peerOrganizations/importerbank.tradefinance.com/peers/peer0.importerbank.tradefinance.com/tls/ca.crt
)

PEER_CONN_PARMS="--peerAddresses peer0.importerbank.tradefinance.com:7051 --tlsRootCertFiles $CRYPTO/peerOrganizations/importerbank.tradefinance.com/peers/peer0.importerbank.tradefinance.com/tls/ca.crt \
  --peerAddresses peer0.exporterbank.tradefinance.com:9051 --tlsRootCertFiles $CRYPTO/peerOrganizations/exporterbank.tradefinance.com/peers/peer0.exporterbank.tradefinance.com/tls/ca.crt \
  --peerAddresses peer0.customs.tradefinance.com:11051 --tlsRootCertFiles $CRYPTO/peerOrganizations/customs.tradefinance.com/peers/peer0.customs.tradefinance.com/tls/ca.crt"

invoke() {
  docker exec "${importer_env[@]}" cli peer chaincode invoke \
    -o $ORDERER_ADDR --tls --cafile $ORDERER_CA \
    -C $CHANNEL_NAME -n $CC_NAME $PEER_CONN_PARMS \
    -c "$1"
  sleep 2
}

query() {
  docker exec "${importer_env[@]}" cli peer chaincode query \
    -C $CHANNEL_NAME -n $CC_NAME -c "$1"
}

echo ">> 1. Creating LC001..."
invoke '{"function":"CreateLC","Args":["LC001","Acme Importers","Global Exports Ltd","ImporterBankOrgMSP","ExporterBankOrgMSP","50000","USD"]}'

echo ">> 2. Reading LC001..."
query '{"function":"GetLC","Args":["LC001"]}'

echo ">> 3. Uploading invoice document..."
invoke '{"function":"UploadDocument","Args":["LC001","INVOICE","QmFakeCID1234invoice","invoice.pdf","sha256:abc123","exporter_user"]}'

echo ">> 4. Uploading bill of lading document..."
invoke '{"function":"UploadDocument","Args":["LC001","BILL_OF_LADING","QmFakeCID5678bol","bol.pdf","sha256:def456","exporter_user"]}'

echo ">> 5. Customs approval..."
invoke '{"function":"CustomsApproval","Args":["LC001","customs_officer_1"]}'

echo ">> 6. Bank approval (this should trigger automatic payment release)..."
invoke '{"function":"BankApproval","Args":["LC001","bank_officer_1"]}'

echo ">> 7. Final LC state (expect status = PAYMENT_RELEASED, paymentReleased = true)..."
query '{"function":"GetLC","Args":["LC001"]}'

echo ">> 8. Full history of LC001..."
query '{"function":"GetLCHistory","Args":["LC001"]}'

echo ">> 9. GetAllLCs..."
query '{"function":"GetAllLCs","Args":[]}'

echo ">> Test workflow complete."
