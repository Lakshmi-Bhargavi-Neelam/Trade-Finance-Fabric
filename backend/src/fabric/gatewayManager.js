const grpc = require('@grpc/grpc-js');
const { connect, hash } = require('@hyperledger/fabric-gateway');
const { ORGS } = require('../config/orgs');
const { loadIdentity, loadPeerTlsCert } = require('./identity');
const config = require('../config');

/**
 * Manages one Fabric Gateway connection per organization.
 * Gateways are created at startup and reused for all requests.
 */
class GatewayManager {
  constructor() {
    /** @type {Map<string, { gateway: import('@hyperledger/fabric-gateway').Gateway, client: grpc.Client, contract: import('@hyperledger/fabric-gateway').Contract }>} */
    this.connections = new Map();
  }

  async connectAll() {
    const errors = [];

    for (const orgKey of Object.keys(ORGS)) {
      try {
        await this.connectOrg(orgKey);
        console.log(`Fabric gateway connected for ${ORGS[orgKey].label} (${orgKey})`);
      } catch (err) {
        errors.push(`${orgKey}: ${err.message}`);
      }
    }

    if (this.connections.size === 0) {
      throw new Error(
        `Failed to connect to any Fabric peer.\n${errors.join('\n')}\n` +
          'Ensure the network is running (network/scripts/start.sh) and crypto material exists.'
      );
    }

    if (errors.length > 0) {
      console.warn('Some Fabric connections failed:\n', errors.join('\n'));
    }
  }

  async connectOrg(orgKey) {
    if (this.connections.has(orgKey)) {
      return this.connections.get(orgKey);
    }

    const org = ORGS[orgKey];
    const tlsCert = loadPeerTlsCert(org);
    const tlsCredentials = grpc.credentials.createSsl(tlsCert);
    const client = new grpc.Client(org.peerEndpoint, tlsCredentials, {
      // Map docker peer hostnames to localhost when discovery returns container names
      'grpc.ssl_target_name_override': org.peerHostAlias,
      'grpc.default_authority': org.peerHostAlias,
    });

    const { mspId, credentials, signer } = loadIdentity(org);

    const gateway = connect({
      client,
      identity: { mspId, credentials },
      signer,
      hash: hash.sha256,
      evaluateOptions: () => ({ deadline: Date.now() + 15000 }),
      endorseOptions: () => ({ deadline: Date.now() + 30000 }),
      submitOptions: () => ({ deadline: Date.now() + 15000 }),
      commitStatusOptions: () => ({ deadline: Date.now() + 60000 }),
    });

    const network = gateway.getNetwork(config.channelName);
    const contract = network.getContract(config.chaincodeName);

    const entry = { gateway, client, contract };
    this.connections.set(orgKey, entry);
    return entry;
  }

  getContract(orgKey) {
    const entry = this.connections.get(orgKey);
    if (!entry) {
      throw new Error(`No Fabric gateway for org "${orgKey}". Is the network running?`);
    }
    return entry.contract;
  }

  async closeAll() {
    for (const [, entry] of this.connections) {
      entry.gateway.close();
      entry.client.close();
    }
    this.connections.clear();
  }
}

module.exports = new GatewayManager();
