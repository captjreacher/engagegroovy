-- Risk Map V1 uses the existing production public.events shape:
-- id, event_type, source_system, entity_type, entity_id, entity_ref, status,
-- payload, correlation_id, run_id, duration_ms, created_at.
-- This migration is intentionally idempotent and does not introduce a parallel event model.
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  source_system TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  entity_ref TEXT,
  status TEXT,
  payload JSONB NOT NULL,
  correlation_id TEXT,
  run_id TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.events ADD COLUMN IF NOT EXISTS source_system TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS entity_type TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS entity_id UUID;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS entity_ref TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS correlation_id TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS run_id TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS duration_ms INTEGER;

CREATE INDEX IF NOT EXISTS idx_events_event_type ON public.events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_status_created_at ON public.events(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_correlation_id ON public.events(correlation_id);
