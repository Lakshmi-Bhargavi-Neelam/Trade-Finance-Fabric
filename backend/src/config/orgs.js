/**
 * Organization and role configuration.
 *
 * Each org has a pre-generated Admin identity (from cryptogen) that the
 * backend uses to sign transactions. The frontend (Phase 3) will pick a
 * simulated role; the backend maps that role to one of these orgs.
 */
const path = require('path');
const config = require('./index');

const cryptoBase = config.cryptoPath;

const ORGS = {
  importerBank: {
    key: 'importerBank',
    label: "Importer's Bank",
    mspId: 'ImporterBankOrgMSP',
    // Host port mapped in docker-compose (connect from the host machine)
    peerEndpoint: 'localhost:7051',
    peerHostAlias: 'peer0.importerbank.tradefinance.com',
    user: 'Admin@importerbank.tradefinance.com',
    cryptoPath: path.join(cryptoBase, 'peerOrganizations/importerbank.tradefinance.com'),
  },
  exporterBank: {
    key: 'exporterBank',
    label: "Exporter's Bank",
    mspId: 'ExporterBankOrgMSP',
    peerEndpoint: 'localhost:9051',
    peerHostAlias: 'peer0.exporterbank.tradefinance.com',
    user: 'Admin@exporterbank.tradefinance.com',
    cryptoPath: path.join(cryptoBase, 'peerOrganizations/exporterbank.tradefinance.com'),
  },
  customs: {
    key: 'customs',
    label: 'Customs Authority',
    mspId: 'CustomsOrgMSP',
    peerEndpoint: 'localhost:11051',
    peerHostAlias: 'peer0.customs.tradefinance.com',
    user: 'Admin@customs.tradefinance.com',
    cryptoPath: path.join(cryptoBase, 'peerOrganizations/customs.tradefinance.com'),
  },
};

/** Simulated user roles from the project spec (no real auth). */
const ROLES = {
  bank_officer: {
    label: 'Bank Officer',
    orgKey: 'importerBank',
    permissions: ['create_lc', 'bank_approval', 'read'],
  },
  exporter_company: {
    label: 'Exporter Company',
    orgKey: 'exporterBank',
    permissions: ['upload_document', 'read'],
  },
  customs_officer: {
    label: 'Customs Officer',
    orgKey: 'customs',
    permissions: ['customs_approval', 'read'],
  },
  importer_company: {
    label: 'Importer Company',
    orgKey: 'importerBank',
    permissions: ['read'],
  },
};

const DEFAULT_ROLE = 'bank_officer';
const DEFAULT_QUERY_ORG = 'importerBank';

function getOrg(orgKey) {
  const org = ORGS[orgKey];
  if (!org) {
    throw new Error(`Unknown organization key: ${orgKey}`);
  }
  return org;
}

function getRole(roleKey) {
  const role = ROLES[roleKey];
  if (!role) {
    throw new Error(`Unknown role: ${roleKey}`);
  }
  return role;
}

function getOrgForRole(roleKey) {
  const role = getRole(roleKey);
  return getOrg(role.orgKey);
}

function roleHasPermission(roleKey, permission) {
  const role = getRole(roleKey);
  return role.permissions.includes(permission);
}

function listRoles() {
  return Object.entries(ROLES).map(([key, role]) => ({
    key,
    label: role.label,
    organization: ORGS[role.orgKey].label,
    permissions: role.permissions,
  }));
}

module.exports = {
  ORGS,
  ROLES,
  DEFAULT_ROLE,
  DEFAULT_QUERY_ORG,
  getOrg,
  getRole,
  getOrgForRole,
  roleHasPermission,
  listRoles,
};
