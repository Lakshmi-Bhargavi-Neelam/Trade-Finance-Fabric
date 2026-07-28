const crypto = require('crypto');

/**
 * Compute a SHA-256 hash of a file buffer.
 * Chaincode stores hashes in the form "sha256:<hex>".
 */
function sha256FileHash(buffer) {
  const hex = crypto.createHash('sha256').update(buffer).digest('hex');
  return `sha256:${hex}`;
}

module.exports = {
  sha256FileHash,
};
