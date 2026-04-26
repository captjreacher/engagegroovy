const { createClient } = require('@supabase/supabase-js');

// These should be set in environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials missing. Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = { supabase };
