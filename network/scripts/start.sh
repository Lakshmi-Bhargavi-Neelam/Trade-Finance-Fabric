#!/bin/bash
# start.sh - Brings up the orderer, 3 peers, 3 CouchDB instances, and the CLI container.
set -euo pipefail
cd "$(dirname "$0")/../.."   # move to parent/

if [ ! -d "crypto-config" ]; then
  echo "!! crypto-config/ not found. Run ./network/scripts/generate.sh first."
  exit 1
fi

echo ">> Starting the Fabric network with docker-compose..."
docker-compose -f network/docker-compose.yaml up -d

echo ">> Waiting for containers to settle..."
sleep 5

docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ">> Network is up. Next: ./network/scripts/createChannel.sh"
