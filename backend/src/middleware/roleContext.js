const { DEFAULT_ROLE, getRole } = require('../config/orgs');

/**
 * Resolve the simulated acting role from header, body, or query string.
 * No authentication — this is intentional for the MVP.
 */
function resolveRole(req) {
  const raw =
    req.headers['x-acting-role'] ||
    req.body?.actingRole ||
    req.query?.actingRole ||
    DEFAULT_ROLE;

  return String(raw).trim().toLowerCase().replace(/\s+/g, '_');
}

function roleContext(req, res, next) {
  try {
    const roleKey = resolveRole(req);
    req.actingRole = roleKey;
    req.roleInfo = getRole(roleKey);
    next();
  } catch (err) {
    err.statusCode = 400;
    next(err);
  }
}

module.exports = {
  roleContext,
  resolveRole,
};
