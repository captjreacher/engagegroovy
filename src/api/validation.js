const express = require('express');
const { validateIssueV1 } = require('../validators/issueSchema');

const router = express.Router();

// Lightweight validation endpoint for ENG-75
router.post('/issue/v1', (req, res) => {
  const payload = req.body && req.body.payload ? req.body.payload : req.body;
  const result = validateIssueV1(payload);
  if (result.valid) {
    return res.status(200).json({ valid: true, errors: [] });
  }
  return res.status(400).json({ valid: false, errors: result.errors });
});

module.exports = router;
