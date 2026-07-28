const express = require('express');
const ipfsClient = require('../ipfs/client');

const router = express.Router();

/** Download a document from IPFS by CID. */
router.get('/:cid', async (req, res, next) => {
  try {
    const buffer = await ipfsClient.downloadFile(req.params.cid);
    res.set('Content-Type', 'application/octet-stream');
    res.send(buffer);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
