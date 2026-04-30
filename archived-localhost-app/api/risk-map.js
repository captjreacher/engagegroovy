const express = require('express');
const { buildRiskMapFlow } = require('../../src/riskEvents');
const { validateIssueV1 } = require('../../src/validators/issueSchema');
const { persistEvents } = require('../lib/events');

const router = express.Router();

function hasRequiredLeadFields(body) {
  return body
    && body.name
    && body.email
    && body.company
    && body.ai_usage
    && body.review_before_use
    && body.output_process_impact
    && body.process_structure
    && body.manual_handoffs
    && body.tooling_dependency;
}

router.post('/submit', async (req, res) => {
  try {
    if (!hasRequiredLeadFields(req.body)) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, email, company, ai_usage, review_before_use, output_process_impact, process_structure, manual_handoffs, and tooling_dependency are required.'
      });
    }

    const flow = buildRiskMapFlow(Object.assign({}, req.body, { source: req.body.source || 'risk-map-api' }));
    const issueValidation = validateIssueV1(flow.paperclip_issue);
    if (!issueValidation.valid) {
      return res.status(422).json({
        success: false,
        message: 'Prepared issue failed issue.v1 validation.',
        errors: issueValidation.errors
      });
    }

    const dryRun = req.query.dry_run === 'true' || req.body.dry_run === true;
    const eventStorage = await persistEvents(flow.events, { dryRun });

    return res.status(200).json({
      success: true,
      message: eventStorage.ok
        ? 'Risk map captured and issue prepared for CEO review.'
        : 'Risk map captured and issue prepared for CEO review; event storage needs attention.',
      flow,
      event_storage: eventStorage
    });
  } catch (error) {
    console.error('Risk map submission error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while preparing risk map.'
    });
  }
});

module.exports = router;
