const express = require('express');
const multer = require('multer');
const lcService = require('../fabric/lcService');
const { roleContext } = require('../middleware/roleContext');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB — sufficient for MVP demo docs
});

router.use(roleContext);

/** Create a new Letter of Credit (Bank Officer). */
// router.post('/', async (req, res, next) => {
//   try {
//     const lc = await lcService.createLC(req.actingRole, req.body);
//     res.status(201).json({ lc });
//   } catch (err) {
//     next(err);
//   }
// });
router.post('/', async (req, res, next) => {
  try {
    console.log(req.body);

    const lc = await lcService.createLC(req.actingRole, req.body);
    res.status(201).json({ lc });
  } catch (err) {
    next(err);
  }
});

/** List all Letters of Credit. */
router.get('/', async (req, res, next) => {
  try {
    const lcs = await lcService.getAllLCs();
    res.json({ lcs });
  } catch (err) {
    next(err);
  }
});

/** Get one Letter of Credit by ID. */
router.get('/:lcId', async (req, res, next) => {
  try {
    const lc = await lcService.getLC(req.params.lcId);
    res.json({ lc });
  } catch (err) {
    next(err);
  }
});

/** Transaction history for one LC. */
router.get('/:lcId/history', async (req, res, next) => {
  try {
    const history = await lcService.getLCHistory(req.params.lcId);
    res.json({ history });
  } catch (err) {
    next(err);
  }
});

/**
 * Upload invoice or bill of lading (Exporter Company).
 * Stores the file in IPFS and records CID + hash on the ledger.
 */
router.post('/:lcId/documents', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      const err = new Error('file is required (multipart field name: file)');
      err.statusCode = 400;
      throw err;
    }

    const result = await lcService.uploadDocument(req.actingRole, req.params.lcId, {
      docType: req.body.docType,
      fileBuffer: req.file.buffer,
      fileName: req.file.originalname,
      uploadedBy: req.body.uploadedBy,
    });

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

/** Customs Officer verifies the shipment. */
router.post('/:lcId/customs-approval', async (req, res, next) => {
  try {
    const lc = await lcService.customsApproval(
      req.actingRole,
      req.params.lcId,
      req.body.approvedBy
    );
    res.json({ lc });
  } catch (err) {
    next(err);
  }
});

/** Bank Officer approves documents (may trigger automatic payment release). */
router.post('/:lcId/bank-approval', async (req, res, next) => {
  try {
    const lc = await lcService.bankApproval(
      req.actingRole,
      req.params.lcId,
      req.body.approvedBy
    );
    res.json({ lc });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
