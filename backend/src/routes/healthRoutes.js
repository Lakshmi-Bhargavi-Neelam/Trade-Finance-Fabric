const express = require('express');
const gatewayManager = require('../fabric/gatewayManager');
const ipfsClient = require('../ipfs/client');
const { listRoles } = require('../config/orgs');
const config = require('../config');

const router = express.Router();

router.get('/health', async (req, res, next) => {
  try {
    const ipfs = await ipfsClient.checkHealth();
    const fabricOrgs = [...gatewayManager.connections.keys()];

    res.json({
      status: fabricOrgs.length > 0 && ipfs.ok ? 'ok' : 'degraded',
      fabric: {
        connectedOrgs: fabricOrgs,
        channel: config.channelName,
        chaincode: config.chaincodeName,
      },
      ipfs,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/roles', (req, res) => {
  res.json({ roles: listRoles() });
});

module.exports = router;
