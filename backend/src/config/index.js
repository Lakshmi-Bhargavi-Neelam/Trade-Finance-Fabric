const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const backendRoot = path.resolve(__dirname, '..', '..');
const projectRoot = path.join(backendRoot, '..');

function resolvePath(relativePath) {
  if (path.isAbsolute(relativePath)) {
    return relativePath;
  }
  return path.resolve(backendRoot, relativePath);
}

console.log("CRYPTO_PATH from env:", process.env.CRYPTO_PATH);
console.log("Resolved crypto path:", resolvePath(process.env.CRYPTO_PATH || "../crypto-config"));

module.exports = {
  port: Number(process.env.PORT) || 3001,
  channelName: process.env.CHANNEL_NAME || 'tradefinancechannel',
  chaincodeName: process.env.CHAINCODE_NAME || 'lccc',
  cryptoPath: resolvePath(process.env.CRYPTO_PATH || '../crypto-config'),
  projectRoot,
  ipfs: {
    apiUrl: process.env.IPFS_API_URL || 'http://127.0.0.1:5001',
    gatewayUrl: process.env.IPFS_GATEWAY_URL || 'http://127.0.0.1:8080',
  },
};
