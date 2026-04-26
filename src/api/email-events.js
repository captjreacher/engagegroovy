const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { supabase } = require('../lib/supabase');
const { emitEvent } = require('../lib/events');

/**
 * Webhook receiver for Supabase email events.
 * Expected to be invoked by Supabase or an email provider integration.
 */
router.post('/webhook', async (req, res) => {
  try {
    const payload = req.body;

    // Optional: verify webhook signature if secret is configured
    const webhookSecret = process.env.EMAIL_WEBHOOK_SIGNATURE_SECRET;
    if (webhookSecret) {
      const providedSignature = (req.headers['x-signature'] || req.headers['X-Signature']);
      const computedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(payload))
        .digest('hex');

      if (!providedSignature || providedSignature !== computedSignature) {
        return res.status(401).json({ ok: false, error: 'Invalid webhook signature' });
      }
    }

    // Basic validation: ensure we received a JSON object
    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ ok: false, error: 'Invalid payload' });
    }

    // Persist the raw webhook payload as an internal event for downstream processing
    const { data: eventRow, error } = await supabase
      .from('events')
      .insert({
        event_type: 'email.webhook',
        payload: payload,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to persist email webhook:', error);
      return res.status(500).json({ ok: false, error: 'Failed to persist email webhook' });
    }

    // Optionally emit an internal event for other workers
    try {
      await emitEvent('email.webhook.received', {
        event_id: eventRow.id,
        received_at: new Date().toISOString(),
        payload_sample: payload // shallow sample for tracing
      });
    } catch (e) {
      // Non-fatal: logging only to avoid blocking webhook acknowledgement
      console.error('Failed to emit internal event for email webhook:', e);
    }

    return res.json({ ok: true, event_id: eventRow.id });
  } catch (err) {
    console.error('Email webhook error:', err);
    return res.status(500).json({ ok: false, error: 'Internal server error' });
  }
});

module.exports = router;
