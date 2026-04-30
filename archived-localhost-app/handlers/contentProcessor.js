const { supabase } = require('../lib/supabase');

/**
 * Handler for the content.package.ingested event.
 * Processes the package and creates draft outputs.
 */
async function handleContentPackageIngested(eventPayload) {
  const { package_id, requested_outputs } = eventPayload;

  console.log(`Processing package ${package_id} for outputs: ${requested_outputs.join(', ')}`);

  // 1. Load the package details
  const { data: package, error: pkgError } = await supabase
    .from('content_packages')
    .select('*')
    .eq('id', package_id)
    .single();

  if (pkgError || !package) {
    console.error(`Failed to load package ${package_id}:`, pkgError);
    return;
  }

  // 2. Iterate and create outputs
  for (const outputType of requested_outputs) {
    const bodyDraft = `DRAFT: ${package.title} → ${outputType}\n\nBased on source content: ${package.summary || 'No summary available.'}`;
    
    const { error: outError } = await supabase
      .from('content_outputs')
      .insert({
        package_id: package.id,
        output_type: outputType,
        status: 'review_requested',
        body: bodyDraft,
        created_by_agent: 'content_agent',
        review_notes: []
      });

    if (outError) {
      console.error(`Failed to create output ${outputType} for package ${package_id}:`, outError);
    } else {
      console.log(`Successfully created draft output for ${outputType}`);
    }
  }

  // 3. Mark event as processed (optional, but good practice)
  // In a real event-driven system, this would be handled by the consumer logic.
}

module.exports = { handleContentPackageIngested };
