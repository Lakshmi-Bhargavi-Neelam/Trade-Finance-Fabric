const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { signers } = require('@hyperledger/fabric-gateway');

/**
 * Load a Fabric X.509 identity and private-key signer from cryptogen MSP folders.
 */
function loadIdentity(org) {
  const mspPath = path.join(org.cryptoPath, 'users', org.user, 'msp');

  const certPath = path.join(mspPath, 'signcerts', `${org.user}-cert.pem`);
  if (!fs.existsSync(certPath)) {
    throw new Error(`Certificate not found: ${certPath}. Run network/scripts/generate.sh first.`);
  }

  const keystoreDir = path.join(mspPath, 'keystore');
  const keyFiles = fs.readdirSync(keystoreDir).filter((f) => !f.startsWith('.'));
  if (keyFiles.length === 0) {
    throw new Error(`No private key in keystore: ${keystoreDir}`);
  }

  const keyPath = path.join(keystoreDir, keyFiles[0]);
  const credentials = fs.readFileSync(certPath);
  const privateKeyPem = fs.readFileSync(keyPath);
  const privateKey = crypto.createPrivateKey(privateKeyPem);
  const signer = signers.newPrivateKeySigner(privateKey);

  return {
    mspId: org.mspId,
    credentials,
    signer,
  };
}

/**
 * TLS root certificate for a peer (used to open the gRPC connection).
 */
function loadPeerTlsCert(org) {
  const tlsCertPath = path.join(
    org.cryptoPath,
    'peers',
    org.peerHostAlias,
    'tls',
    'ca.crt'
  );

  if (!fs.existsSync(tlsCertPath)) {
    throw new Error(`Peer TLS certificate not found: ${tlsCertPath}`);
  }

  return fs.readFileSync(tlsCertPath);
}

module.exports = {
  loadIdentity,
  loadPeerTlsCert,
};
