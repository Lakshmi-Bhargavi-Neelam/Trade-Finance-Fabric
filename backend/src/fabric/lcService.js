const gatewayManager = require('./gatewayManager');
const {
  getOrgForRole,
  roleHasPermission,
  DEFAULT_QUERY_ORG,
} = require('../config/orgs');
const ipfsClient = require('../ipfs/client');
const { sha256FileHash } = require('../utils/fileHash');

// function parseJsonResult(buffer) {
//   const text = buffer.toString('utf8').trim();
//   if (!text) {
//     return null;
//   }
//   return JSON.parse(text);
// }

function parseJsonResult(result) {
  const text = Buffer.from(result).toString('utf8').trim();

  if (!text) {
    return null;
  }

  return JSON.parse(text);
}

function contractForRole(role, permission) {
  if (!roleHasPermission(role, permission)) {
    const err = new Error(`Role "${role}" is not allowed to perform "${permission}"`);
    err.statusCode = 403;
    throw err;
  }
  const org = getOrgForRole(role);
  return { contract: gatewayManager.getContract(org.key), org };
}

function contractForQuery() {
  return gatewayManager.getContract(DEFAULT_QUERY_ORG);
}

async function createLC(role, payload) {
  const { contract } = contractForRole(role, 'create_lc');
  const {
    lcId,
    importer,
    exporter,
    importerBank = 'ImporterBankOrgMSP',
    exporterBank = 'ExporterBankOrgMSP',
    commodity,
    quantity,
    amount,
    currency = 'USD',
    expiryDate,
  } = payload;

  if (!lcId || !importer || !exporter ||!commodity || !quantity ||
    !expiryDate || amount == null) {
    const err = new Error('lcId, importer, exporter, commodity, quantity, amount and expiryDate are required');
    err.statusCode = 400;
    throw err;
  }

  await contract.submitTransaction(
    'CreateLC',
    lcId,
    importer,
    exporter,
    importerBank,
    exporterBank,
    commodity,
    quantity,
    String(amount),
    currency,
    expiryDate
  );

  return getLC(lcId);
}

// async function getLC(lcId) {
//   const contract = contractForQuery();
//   const result = await contract.evaluateTransaction("GetLC", lcId);

//   const lc = parseJsonResult(result);

//   console.log(JSON.stringify(lc, null, 2));

//   return lc;
// }

async function getLC(lcId) {
  const contract = contractForQuery();
  const result = await contract.evaluateTransaction('GetLC', lcId);
  return parseJsonResult(result);
}

async function getAllLCs() {
  const contract = contractForQuery();
  const result = await contract.evaluateTransaction('GetAllLCs');
  return parseJsonResult(result) || [];
}

async function getLCHistory(lcId) {
  const contract = contractForQuery();
  const result = await contract.evaluateTransaction('GetLCHistory', lcId);
  return parseJsonResult(result) || [];
}

/**
 * Upload a document to IPFS, hash it, and record metadata on the ledger.
 */
async function uploadDocument(role, lcId, { docType, fileBuffer, fileName, uploadedBy }) {
  const { contract } = contractForRole(role, 'upload_document');

  if (!docType || !fileBuffer || !fileName) {
    const err = new Error('docType and file are required');
    err.statusCode = 400;
    throw err;
  }

  if (docType !== 'INVOICE' && docType !== 'BILL_OF_LADING') {
    const err = new Error('docType must be INVOICE or BILL_OF_LADING');
    err.statusCode = 400;
    throw err;
  }

  const cid = await ipfsClient.uploadFile(fileBuffer, fileName);
  const fileHash = sha256FileHash(fileBuffer);

  await contract.submitTransaction(
    'UploadDocument',
    lcId,
    docType,
    cid,
    fileName,
    fileHash,
    uploadedBy || 'exporter_user'
  );

  const lc = await getLC(lcId);
  return { cid, fileHash, fileName, docType, lc };
}

async function customsApproval(role, lcId, approvedBy) {
  const { contract } = contractForRole(role, 'customs_approval');

  await contract.submitTransaction(
    'CustomsApproval',
    lcId,
    approvedBy || 'customs_officer'
  );

  return getLC(lcId);
}

async function bankApproval(role, lcId, approvedBy) {
  const { contract } = contractForRole(role, 'bank_approval');

  await contract.submitTransaction(
    'BankApproval',
    lcId,
    approvedBy || 'bank_officer'
  );

  return getLC(lcId);
}

module.exports = {
  createLC,
  getLC,
  getAllLCs,
  getLCHistory,
  uploadDocument,
  customsApproval,
  bankApproval,
};
