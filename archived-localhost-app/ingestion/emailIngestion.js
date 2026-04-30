const { supabase } = require('../lib/supabase');
const { emitEvent } = require('../lib/events');

/**
 * Ingest an inbound email webhook payload and convert it into a Paperclip issue.
 * This is a minimal, idempotent implementation to bootstrap ticket creation from email.
 *
 * Expected eventPayload shape (from email webhook):
 * {
 *   event_id: string,
 *   received_at: string,
 *   payload_sample: { from, to, subject, body, ... }
 * }
 */
async function handleEmailIngestion(eventPayload) {
  if (!eventPayload) {
    throw new Error('Missing eventPayload for email ingestion');
  }

  const { event_id, received_at, payload_sample } = eventPayload;
  const email = payload_sample || {};
  const sender = email.from || email.sender || '';
  const recipient = email.to || email.recipient || '';
  const subject = email.subject || 'No subject';
  const body = email.body || email.text || '';

  // Idempotency: check if an issue already exists for this correlation_id (event_id)
  const { data: existing } = await supabase
    .from('issues')
    .select('id')
    .eq('correlation_id', event_id)
    .maybeSingle();

  if (existing && existing.id) {
    console.log(`Email ingestion already processed for event ${event_id}, existing issue ${existing.id}`);
    return existing;
  }

  const now = new Date().toISOString();

  // Minimal issue creation; rely on defaults in the database for schema/owner/routing
  const { data: issue, error } = await supabase
    .from('issues')
    .insert([
      {
        title: subject,
        description: body || '',
        domain: 'customer_email',
        event_type: 'email',
        source: 'customer_email',
        correlation_id: event_id,
        created_at: now,
        updated_at: now,
        status: 'open',
        owner_id: 'CTO', // default routing to CTO; can be overridden by business rules later
        routing_path: '/issues/email',
        attachments: email.attachments || [],
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('Failed to create issue from email webhook payload:', error);
    throw error;
  }

  // Emit a follow-up internal event so downstream listeners can react (optional)
  try {
    await emitEvent('email.issue.created', {
      issue_id: issue.id,
      source_email: sender,
      recipient: recipient,
      subject: subject,
      correlation_id: event_id,
      created_at: now,
      received_at: received_at
    });
  } catch (e) {
    console.warn('Failed to emit internal event for email ingestion:', e);
  }

  return issue;
}

module.exports = { handleEmailIngestion };
