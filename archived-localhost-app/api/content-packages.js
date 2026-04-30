const express = require('express');
const router = express.Router();
const { ingestionSchema } = require('../schemas/ingestionSchema');
const { supabase } = require('../lib/supabase');
const { emitEvent } = require('../lib/events');

router.post('/ingest', async (req, res) => {
  try {
    // 1. Strict Schema Validation
    const validatedData = ingestionSchema.safeParse(req.body);

    if (!validatedData.success) {
      return res.status(400).json({
        ok: false,
        error: 'Validation failed',
        details: validatedData.error.format()
      });
    }

    const payload = validatedData.data;

    // 2. Database Persistence
    const { data: package, error: dbError } = await supabase
      .from('content_packages')
      .insert({
        source_id: payload.content_id,
        source_system: payload.source_system,
        source_type: payload.source_type,
        content_type: payload.content_type,
        title: payload.title,
        body_markdown: payload.body_markdown,
        summary: payload.summary,
        tags: payload.tags,
        requested_outputs: payload.requested_outputs,
        status: payload.status,
        review_required: payload.review_required,
        submitted_by: payload.submitted_by,
        submitted_at: payload.submitted_at
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database write failed:', dbError);
      return res.status(500).json({ ok: false, error: 'Failed to persist content package' });
    }

    // 3. Event Emission
    const event = await emitEvent('content.package.ingested', {
      package_id: package.id,
      content_type: package.content_type,
      requested_outputs: package.requested_outputs,
      review_required: package.review_required
    });

    // 4. Response
    return res.status(201).json({
      ok: true,
      package_id: package.id,
      event_id: event.id,
      status: 'ingested'
    });

  } catch (error) {
    console.error('Ingestion error:', error);
    return res.status(500).json({ ok: false, error: 'Internal server error' });
  }
});

module.exports = router;
