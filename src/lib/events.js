const { supabase } = require('./supabase');

/**
 * Emits a system event to the database.
 * @param {string} eventType 
 * @param {object} payload 
 */
async function emitEvent(eventType, payload) {
  const { data, error } = await supabase
    .from('events')
    .insert({
      event_type: eventType,
      payload: payload,
      status: 'pending'
    })
    .select()
    .single();

  if (error) {
    console.error(`Failed to emit event ${eventType}:`, error);
    throw error;
  }

  return data;
}

module.exports = { emitEvent };
