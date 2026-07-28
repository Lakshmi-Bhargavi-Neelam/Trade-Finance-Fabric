#!/bin/bash
# createChannel.sh
#
# Creates "tradefinancechannel" and joins all three org peers to it,
# then updates each org's anchor peer. All commands run inside the
# `cli` container, switching identity (CORE_PEER_* env vars) between
# orgs as needed.
set -euo pipefail

CHANNEL_NAME=tradefinancechannel
ORDERER_ADDR=orderer.tradefinance.com:7050
ORDERER_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/orderer.tradefinance.com/orderers/orderer.tradefinance.com/tls/ca.crt

CRYPTO=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto

# Helper: build the -e flags for docker exec that select an org's identity.
importer_env=(
  -e CORE_PEER_LOCALMSPID=ImporterBankOrgMSP
  -e CORE_PEER_ADDRESS=peer0.importerbank.tradefinance.com:7051
  -e CORE_PEER_MSPCONFIGPATH=$CRYPTO/peerOrganizations/importerbank.tradefinance.com/users/Admin@importerbank.tradefinance.com/msp
  -e CORE_PEER_TLS_ROOTCERT_FILE=$CRYPTO/peerOrganizations/importerbank.tradefinance.com/peers/peer0.importerbank.tradefinance.com/tls/ca.crt
)
exporter_env=(
  -e CORE_PEER_LOCALMSPID=ExporterBankOrgMSP
  -e CORE_PEER_ADDRESS=peer0.exporterbank.tradefinance.com:9051
  -e CORE_PEER_MSPCONFIGPATH=$CRYPTO/peerOrganizations/exporterbank.tradefinance.com/users/Admin@exporterbank.tradefinance.com/msp
  -e CORE_PEER_TLS_ROOTCERT_FILE=$CRYPTO/peerOrganizations/exporterbank.tradefinance.com/peers/peer0.exporterbank.tradefinance.com/tls/ca.crt
)
customs_env=(
  -e CORE_PEER_LOCALMSPID=CustomsOrgMSP
  -e CORE_PEER_ADDRESS=peer0.customs.tradefinance.com:11051
  -e CORE_PEER_MSPCONFIGPATH=$CRYPTO/peerOrganizations/customs.tradefinance.com/users/Admin@customs.tradefinance.com/msp
  -e CORE_PEER_TLS_ROOTCERT_FILE=$CRYPTO/peerOrganizations/customs.tradefinance.com/peers/peer0.customs.tradefinance.com/tls/ca.crt
)

echo ">> Creating channel $CHANNEL_NAME (as ImporterBankOrg)..."
docker exec "${importer_env[@]}" cli peer channel create \
  -o $ORDERER_ADDR \
  -c $CHANNEL_NAME \
  -f ./channel-artifacts/$CHANNEL_NAME.tx \
  --outputBlock ./channel-artifacts/$CHANNEL_NAME.block \
  --tls --cafile $ORDERER_CA

echo ">> Joining ImporterBankOrg peer..."
docker exec "${importer_env[@]}" cli peer channel join -b ./channel-artifacts/$CHANNEL_NAME.block

echo ">> Joining ExporterBankOrg peer..."
docker exec "${exporter_env[@]}" cli peer channel join -b ./channel-artifacts/$CHANNEL_NAME.block

echo ">> Joining CustomsOrg peer..."
docker exec "${customs_env[@]}" cli peer channel join -b ./channel-artifacts/$CHANNEL_NAME.block

echo ">> Updating anchor peers..."
docker exec "${importer_env[@]}" cli peer channel update \
  -o $ORDERER_ADDR -c $CHANNEL_NAME \
  -f ./channel-artifacts/ImporterBankOrgMSPanchors.tx --tls --cafile $ORDERER_CA

docker exec "${exporter_env[@]}" cli peer channel update \
  -o $ORDERER_ADDR -c $CHANNEL_NAME \
  -f ./channel-artifacts/ExporterBankOrgMSPanchors.tx --tls --cafile $ORDERER_CA

docker exec "${customs_env[@]}" cli peer channel update \
  -o $ORDERER_ADDR -c $CHANNEL_NAME \
  -f ./channel-artifacts/CustomsOrgMSPanchors.tx --tls --cafile $ORDERER_CA

echo ">> Channel $CHANNEL_NAME created and all three org peers have joined."
