const { supabase } = require('./supabase');

const EVENT_TABLE = 'events';

function isDryRunEnabled(value = process.env.RISK_MAP_EVENT_DRY_RUN) {
  return String(value || '').toLowerCase() === 'true';
}

function validateEventEnvelope(event) {
  const errors = [];
  if (!event || typeof event !== 'object') {
    errors.push('event must be an object');
    return errors;
  }

  if (!event.event_type || typeof event.event_type !== 'string') {
    errors.push('event.event_type is required');
  }
  if (!event.schema || typeof event.schema !== 'string') {
    errors.push('event.schema is required');
  }
  if (!event.domain || typeof event.domain !== 'string') {
    errors.push('event.domain is required');
  }
  if (!event.occurred_at || Number.isNaN(Date.parse(event.occurred_at))) {
    errors.push('event.occurred_at must be a valid ISO date-time');
  }
  if (!event.payload || typeof event.payload !== 'object') {
    errors.push('event.payload is required');
  }

  return errors;
}

function isUUID(value) {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function mapEventToRow(event) {
  const entityTypeByEvent = {
    'lead.captured': 'lead',
    'risk.profile.generated': 'risk_profile',
    'pipeline.recommended': 'pipeline',
    'paperclip.issue.prepared': 'paperclip_issue'
  };
  const payloadId = event.payload && event.payload.id;
  const entityRef = event.payload && (
    event.payload.id
    || event.payload.lead_email
    || event.payload.company
    || event.payload.title
  );
  const correlationId = event.payload && (
    event.payload.id
    || event.payload.lead_email
    || event.payload.company
  );

  return {
    event_type: event.event_type,
    source_system: event.domain || 'engagegroovy',
    entity_type: entityTypeByEvent[event.event_type] || 'event',
    entity_id: isUUID(payloadId) ? payloadId : null,
    entity_ref: entityRef ? String(entityRef) : event.event_type,
    payload: event,
    correlation_id: correlationId ? String(correlationId) : null,
    status: 'pending'
  };
}

function serializeSupabaseError(error) {
  if (!error) return { code: 'unknown_error', message: 'Unknown event storage error' };
  return {
    code: error.code || 'supabase_insert_failed',
    message: error.message || 'Supabase insert failed',
    details: error.details || null,
    hint: error.hint || null
  };
}

function createMissingConfigError() {
  return {
    code: 'supabase_config_missing',
    message: 'Supabase event storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, or enable RISK_MAP_EVENT_DRY_RUN=true for local validation.',
    required_env: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']
  };
}

function createValidationError(event, errors) {
  return {
    event_type: event && event.event_type ? event.event_type : 'unknown',
    code: 'invalid_event_payload',
    message: 'Event envelope failed local validation before Supabase insert.',
    details: errors
  };
}

async function insertEventRows(client, rows) {
  return client
    .from(EVENT_TABLE)
    .insert(rows)
    .select();
}

async function persistEvents(events, options = {}) {
  const eventList = Array.isArray(events) ? events : [events];
  const client = options.supabase !== undefined ? options.supabase : supabase;
  const dryRun = options.dryRun !== undefined ? options.dryRun : isDryRunEnabled();
  const validationErrors = [];

  eventList.forEach((event) => {
    const errors = validateEventEnvelope(event);
    if (errors.length) {
      validationErrors.push(createValidationError(event, errors));
    }
  });

  if (validationErrors.length) {
    return {
      ok: false,
      mode: 'validation',
      stored_events: [],
      attempted_events: eventList.length,
      errors: validationErrors
    };
  }

  const rows = eventList.map(mapEventToRow);

  if (dryRun) {
    return {
      ok: true,
      mode: 'dry_run',
      stored_events: rows.map((row) => ({
        event_type: row.event_type,
        payload: row.payload,
        status: row.status,
        dry_run: true
      })),
      attempted_events: eventList.length,
      errors: []
    };
  }

  if (!client) {
    return {
      ok: false,
      mode: 'missing_config',
      stored_events: [],
      attempted_events: eventList.length,
      errors: [createMissingConfigError()]
    };
  }

  try {
    const { data, error } = await insertEventRows(client, rows);
    if (error) {
      return {
        ok: false,
        mode: 'supabase',
        stored_events: [],
        attempted_events: eventList.length,
        errors: [serializeSupabaseError(error)]
      };
    }

    return {
      ok: true,
      mode: 'supabase',
      stored_events: data || [],
      attempted_events: eventList.length,
      errors: []
    };
  } catch (error) {
    return {
      ok: false,
      mode: 'supabase',
      stored_events: [],
      attempted_events: eventList.length,
      errors: [serializeSupabaseError(error)]
    };
  }
}

async function emitEvent(eventType, payload, options = {}) {
  const event = payload && payload.event_type ? payload : {
    event_type: eventType,
    schema: `${eventType}.v1`,
    domain: 'engagegroovy',
    occurred_at: new Date().toISOString(),
    payload: payload || {}
  };

  const result = await persistEvents([event], options);
  if (!result.ok) {
    const error = new Error(result.errors.map((item) => item.message).join('; '));
    error.event_storage = result;
    throw error;
  }

  return result.stored_events[0];
}

module.exports = {
  EVENT_TABLE,
  emitEvent,
  persistEvents,
  mapEventToRow,
  validateEventEnvelope,
  isDryRunEnabled
};
