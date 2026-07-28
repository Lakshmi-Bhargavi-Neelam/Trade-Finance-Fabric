#!/bin/bash
# deployChaincode.sh
#
# Packages, installs (on all 3 peers), approves (by all 3 orgs), and
# commits the lc-chaincode using the Fabric 2.x chaincode lifecycle.
set -euo pipefail

CHANNEL_NAME=tradefinancechannel
CC_NAME=lccc
CC_VERSION=1.3
CC_SEQUENCE=4
CC_SRC_PATH=/opt/gopath/src/github.com/chaincode/lc-chaincode
ORDERER_ADDR=orderer.tradefinance.com:7050
ORDERER_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/tradefinance.com/orderers/orderer.tradefinance.com/tls/ca.crt
CRYPTO=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto

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

echo ">> Vendoring chaincode Go dependencies (inside CLI container)..."
docker exec "${importer_env[@]}" cli bash -c \
  "cd $CC_SRC_PATH && GO111MODULE=on go mod vendor"

echo ">> Packaging chaincode..."
docker exec "${importer_env[@]}" cli peer lifecycle chaincode package ${CC_NAME}.tar.gz \
  --path $CC_SRC_PATH --lang golang --label ${CC_NAME}_${CC_VERSION}

echo ">> Installing on ImporterBankOrg peer..."
docker exec "${importer_env[@]}" cli peer lifecycle chaincode install ${CC_NAME}.tar.gz

echo ">> Installing on ExporterBankOrg peer..."
docker exec "${exporter_env[@]}" cli peer lifecycle chaincode install ${CC_NAME}.tar.gz

echo ">> Installing on CustomsOrg peer..."
docker exec "${customs_env[@]}" cli peer lifecycle chaincode install ${CC_NAME}.tar.gz

echo ">> Fetching package ID..."
PACKAGE_ID=$(docker exec "${importer_env[@]}" cli peer lifecycle chaincode queryinstalled \
| grep "${CC_NAME}_${CC_VERSION}" \
| tail -1 \
| sed -n 's/^Package ID: \(.*\), Label:.*/\1/p')
echo "Package ID: $PACKAGE_ID"

echo ">> Approving chaincode definition (ImporterBankOrg)..."
docker exec "${importer_env[@]}" cli peer lifecycle chaincode approveformyorg \
  -o $ORDERER_ADDR --tls --cafile $ORDERER_CA \
  --channelID $CHANNEL_NAME --name $CC_NAME --version $CC_VERSION \
  --package-id $PACKAGE_ID --sequence $CC_SEQUENCE

echo ">> Approving chaincode definition (ExporterBankOrg)..."
docker exec "${exporter_env[@]}" cli peer lifecycle chaincode approveformyorg \
  -o $ORDERER_ADDR --tls --cafile $ORDERER_CA \
  --channelID $CHANNEL_NAME --name $CC_NAME --version $CC_VERSION \
  --package-id $PACKAGE_ID --sequence $CC_SEQUENCE

echo ">> Approving chaincode definition (CustomsOrg)..."
docker exec "${customs_env[@]}" cli peer lifecycle chaincode approveformyorg \
  -o $ORDERER_ADDR --tls --cafile $ORDERER_CA \
  --channelID $CHANNEL_NAME --name $CC_NAME --version $CC_VERSION \
  --package-id $PACKAGE_ID --sequence $CC_SEQUENCE

echo ">> Checking commit readiness..."
docker exec "${importer_env[@]}" cli peer lifecycle chaincode checkcommitreadiness \
  --channelID $CHANNEL_NAME --name $CC_NAME --version $CC_VERSION \
  --sequence $CC_SEQUENCE --output json

echo ">> Committing chaincode definition to the channel..."
docker exec "${importer_env[@]}" cli peer lifecycle chaincode commit \
  -o $ORDERER_ADDR --tls --cafile $ORDERER_CA \
  --channelID $CHANNEL_NAME --name $CC_NAME --version $CC_VERSION \
  --sequence $CC_SEQUENCE \
  --peerAddresses peer0.importerbank.tradefinance.com:7051 \
  --tlsRootCertFiles $CRYPTO/peerOrganizations/importerbank.tradefinance.com/peers/peer0.importerbank.tradefinance.com/tls/ca.crt \
  --peerAddresses peer0.exporterbank.tradefinance.com:9051 \
  --tlsRootCertFiles $CRYPTO/peerOrganizations/exporterbank.tradefinance.com/peers/peer0.exporterbank.tradefinance.com/tls/ca.crt \
  --peerAddresses peer0.customs.tradefinance.com:11051 \
  --tlsRootCertFiles $CRYPTO/peerOrganizations/customs.tradefinance.com/peers/peer0.customs.tradefinance.com/tls/ca.crt

echo ">> Chaincode '$CC_NAME' v$CC_VERSION committed to channel '$CHANNEL_NAME'."
echo ">> Try it: docker exec ${importer_env[*]} cli peer chaincode invoke ..."
