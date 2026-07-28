/**
 * End-to-end API test for Phase 2.
 *
 * Prerequisites:
 *   - Fabric network running with chaincode deployed
 *   - IPFS node running (docker-compose ipfs service)
 *   - Backend running: npm start
 *
 * Usage: npm run test:api
 */
const fs = require('fs');
const path = require('path');

const BASE = process.env.API_URL || 'http://localhost:3001/api';
const LC_ID = `LC-API-${Date.now()}`;

async function request(method, urlPath, { role, body, formData } = {}) {
  const headers = {};
  if (role) {
    headers['X-Acting-Role'] = role;
  }

  let bodyPayload;
  if (formData) {
    bodyPayload = formData;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    bodyPayload = JSON.stringify(body);
  }

  const res = await fetch(`${BASE}${urlPath}`, {
    method,
    headers,
    body: bodyPayload,
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    throw new Error(`${method} ${urlPath} failed (${res.status}): ${JSON.stringify(data)}`);
  }

  return data;
}

function makeTestFile(name, content) {
  return new Blob([content], { type: 'application/pdf' });
}

async function main() {
  console.log('>> Phase 2 API test');
  console.log(`>> LC ID: ${LC_ID}\n`);

  const health = await request('GET', '/health');
  console.log('1. Health:', health.status, `(Fabric orgs: ${health.fabric.connectedOrgs.join(', ')})`);

  const created = await request('POST', '/lcs', {
    role: 'bank_officer',
    body: {
      lcId: LC_ID,
      importer: 'Acme Importers',
      exporter: 'Global Exports Ltd',
      amount: 75000,
      currency: 'USD',
    },
  });
  console.log('2. Created LC:', created.lc.lcId, 'status =', created.lc.status);

  const invoiceContent = `Invoice for ${LC_ID} - amount 75000 USD`;
  const bolContent = `Bill of Lading for ${LC_ID}`;

  const invoiceForm = new FormData();
  invoiceForm.append('file', makeTestFile('invoice.pdf', invoiceContent), 'invoice.pdf');
  invoiceForm.append('docType', 'INVOICE');
  invoiceForm.append('uploadedBy', 'exporter_user');

  const invoiceResult = await request('POST', `/lcs/${LC_ID}/documents`, {
    role: 'exporter_company',
    formData: invoiceForm,
  });
  console.log('3. Uploaded invoice CID:', invoiceResult.cid);

  const bolForm = new FormData();
  bolForm.append('file', makeTestFile('bol.pdf', bolContent), 'bol.pdf');
  bolForm.append('docType', 'BILL_OF_LADING');
  bolForm.append('uploadedBy', 'exporter_user');

  const bolResult = await request('POST', `/lcs/${LC_ID}/documents`, {
    role: 'exporter_company',
    formData: bolForm,
  });
  console.log('4. Uploaded BOL CID:', bolResult.cid);

  const customs = await request('POST', `/lcs/${LC_ID}/customs-approval`, {
    role: 'customs_officer',
    body: { approvedBy: 'customs_officer_1' },
  });
  console.log('5. Customs approved, status =', customs.lc.status);

  const bank = await request('POST', `/lcs/${LC_ID}/bank-approval`, {
    role: 'bank_officer',
    body: { approvedBy: 'bank_officer_1' },
  });
  console.log('6. Bank approved, status =', bank.lc.status, 'paymentReleased =', bank.lc.paymentReleased);

  if (bank.lc.status !== 'PAYMENT_RELEASED' || !bank.lc.paymentReleased) {
    throw new Error('Expected PAYMENT_RELEASED after both approvals');
  }

  const history = await request('GET', `/lcs/${LC_ID}/history`);
  console.log('7. History entries:', history.history.length);

  const all = await request('GET', '/lcs');
  console.log('8. Total LCs on ledger:', all.lcs.length);

  console.log('\n>> Phase 2 API test PASSED');
}

main().catch((err) => {
  console.error('\n>> Phase 2 API test FAILED:', err.message);
  process.exit(1);
});
