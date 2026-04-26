ENG-75: Confirm Issue Schema
Description:
- Validate and codify the standard schema used for issues in Paperclip tasks.

Proposed Core Fields:
- id: string (UUID)
- title: string
- description: string
- domain: string (e.g., engineering, product)
- event_type: string (e.g., issue, task, bug, feature)
- schema: string (versioned schema name, e.g., issue.v1)
- routing_path: string (how it should be routed)
- priority: string (low/medium/high)
- status: string (pending/in_progress/completed/cancelled)
- assignee: string (user id)
- created_at: string (ISO timestamp)
- updated_at: string (ISO timestamp)
- attachments: array of strings (URLs or IDs)
- comments: array of objects { id, author, text, created_at }

Validation Rules (proposed):
- id must be present
- title must be non-empty
- domain, event_type, schema, routing_path are required
- status must be one of: pending, in_progress, completed, cancelled
- created_at must be present; updated_at must be present on changes
- comments array elements must contain required fields

Usage Notes:
- This schema should be enforced by the creation/updating API for issues
- If ENG-75 requires adjustments to field names or types, update here

Next Steps:
- Add a minimal JSON schema for this structure (issue.v1)
- Add a sample ENG-75 JSON payload
- Create unit tests for validation rules
- Request QA review on the schema and sample payload
