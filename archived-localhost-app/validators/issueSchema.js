// Lightweight in-memory validation for ENG-75: issue.v1 payloads
// This is a minimal validator to bootstrap runtime validation without additional deps.

function isUUID(str) {
  return typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

function isDateTime(str) {
  const t = Date.parse(str);
  return Number.isFinite(t);
}

function validateIssueV1(payload) {
  const errors = [];
  if (!payload || typeof payload !== 'object') {
    errors.push('payload must be an object');
    return { valid: false, errors };
  }

  const required = ['id','title','domain','event_type','schema','routing_path','status','created_at','updated_at'];
  required.forEach((r) => {
    if (payload[r] === undefined || payload[r] === null) {
      errors.push(`missing required field: ${r}`);
    }
  });

  if (payload.id && !isUUID(payload.id)) {
    errors.push('id must be a valid UUID');
  }

  if (payload.created_at && !isDateTime(payload.created_at)) {
    errors.push('created_at must be a valid ISO date-time');
  }
  if (payload.updated_at && !isDateTime(payload.updated_at)) {
    errors.push('updated_at must be a valid ISO date-time');
  }

  const allowedStatus = ['pending','in_progress','completed','cancelled'];
  if (payload.status && !allowedStatus.includes(payload.status)) {
    errors.push(`status must be one of: ${allowedStatus.join(', ')}`);
  }

  if (payload.attachments !== undefined) {
    if (!Array.isArray(payload.attachments)) {
      errors.push('attachments must be an array of strings');
    } else {
      for (const a of payload.attachments) {
        if (typeof a !== 'string') {
          errors.push('attachments must be strings');
          break;
        }
      }
    }
  }

  if (payload.comments !== undefined) {
    if (!Array.isArray(payload.comments)) {
      errors.push('comments must be an array');
    } else {
      for (const c of payload.comments) {
        if (typeof c !== 'object' || c === null) {
          errors.push('each comment must be an object');
          break;
        }
        const req = ['id','author','text','created_at'];
        req.forEach((k) => {
          if (c[k] === undefined || c[k] === null) {
            errors.push(`comment missing required field: ${k}`);
          }
        });
        if (c.created_at && !isDateTime(c.created_at)) {
          errors.push('comment.created_at must be a valid ISO date-time');
        }
      }
    }
  }

  // Basic string checks for a subset of fields
  if (payload.domain && typeof payload.domain !== 'string') {
    errors.push('domain must be a string');
  }
  if (payload.event_type && typeof payload.event_type !== 'string') {
    errors.push('event_type must be a string');
  }
  if (payload.routing_path && typeof payload.routing_path !== 'string') {
    errors.push('routing_path must be a string');
  }

  return { valid: errors.length === 0, errors };
}

module.exports = { validateIssueV1 };
