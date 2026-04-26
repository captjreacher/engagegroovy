const { z } = require('zod');

const ingestionSchema = z.object({
  content_id: z.string(),
  source_system: z.string().default('mgrnz'),
  source_type: z.string().default('notion'),
  status: z.literal('approved_for_ingestion'),
  title: z.string(),
  content_type: z.enum(['article', 'newsletter', 'social_post', 'campaign_brief']),
  body_markdown: z.string().min(1, "body_markdown must not be empty"),
  summary: z.string(),
  tags: z.array(z.string()),
  requested_outputs: z.array(z.string()).min(1, "requested_outputs must not be empty"),
  review_required: z.boolean(),
  submitted_by: z.string(),
  submitted_at: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "submitted_at must be a valid ISO timestamp"
  })
});

module.exports = { ingestionSchema };
