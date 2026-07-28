#!/bin/bash
# stop.sh - Tears down the network and removes volumes/crypto material.
set -euo pipefail
cd "$(dirname "$0")/../.."   # move to network/

echo ">> Stopping and removing containers, networks, and volumes..."
docker-compose -f network/docker-compose.yaml down --volumes --remove-orphans

read -p "Also delete crypto-config/ and channel-artifacts/? [y/N] " confirm
if [[ "$confirm" =~ ^[Yy]$ ]]; then
  rm -rf crypto-config channel-artifacts
  echo ">> Removed crypto-config/ and channel-artifacts/"
fi

echo ">> Network stopped."
