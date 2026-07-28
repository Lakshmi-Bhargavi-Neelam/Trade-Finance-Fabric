#!/bin/bash
# generate.sh
#
# Generates MSP crypto material (cryptogen) and the orderer genesis
# block + channel creation transaction (configtxgen).
#
# Requires the Fabric binaries (cryptogen, configtxgen) to be on your
# PATH. Get them with Fabric's official bootstrap script:
#   curl -sSL https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/bootstrap.sh | bash -s
# which drops them in ./bin relative to where you run it.

set -euo pipefail
cd "$(dirname "$0")/.."   # move to network/

echo ">> Cleaning up any previous artifacts..."
rm -rf ../crypto-config ../channel-artifacts
mkdir -p ../channel-artifacts

echo ">> Generating crypto material with cryptogen..."
cryptogen generate \
  --config=./crypto-config.yaml \
  --output=../crypto-config
  
echo ">> Generating orderer genesis block..."
configtxgen -profile TradeFinanceOrdererGenesis \
  -channelID system-channel \
  -outputBlock ../channel-artifacts/genesis.block \
  -configPath .

echo ">> Generating channel creation transaction..."
configtxgen -profile TradeFinanceChannel \
  -outputCreateChannelTx ../channel-artifacts/tradefinancechannel.tx \
  -channelID tradefinancechannel \
  -configPath .

echo ">> Generating anchor peer updates..."
configtxgen -profile TradeFinanceChannel \
  -outputAnchorPeersUpdate ../channel-artifacts/ImporterBankOrgMSPanchors.tx \
  -channelID tradefinancechannel \
  -asOrg ImporterBankOrgMSP \
  -configPath .

configtxgen -profile TradeFinanceChannel \
  -outputAnchorPeersUpdate ../channel-artifacts/ExporterBankOrgMSPanchors.tx \
  -channelID tradefinancechannel \
  -asOrg ExporterBankOrgMSP \
  -configPath .

configtxgen -profile TradeFinanceChannel \
  -outputAnchorPeersUpdate ../channel-artifacts/CustomsOrgMSPanchors.tx \
  -channelID tradefinancechannel \
  -asOrg CustomsOrgMSP \
  -configPath .

echo ">> Done. Crypto material is in ../crypto-config, channel artifacts in ../channel-artifacts"
