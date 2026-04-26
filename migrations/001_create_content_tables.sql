-- content_packages table
CREATE TABLE IF NOT EXISTS content_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_system TEXT NOT NULL,
    source_type TEXT NOT NULL,
    source_id TEXT NOT NULL,
    content_type TEXT NOT NULL,
    title TEXT NOT NULL,
    body_markdown TEXT NOT NULL,
    summary TEXT,
    tags JSONB DEFAULT '[]',
    requested_outputs JSONB DEFAULT '[]',
    status TEXT NOT NULL,
    review_required BOOLEAN DEFAULT true,
    submitted_by TEXT NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- content_outputs table
CREATE TABLE IF NOT EXISTS content_outputs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id UUID REFERENCES content_packages(id) ON DELETE CASCADE,
    output_type TEXT NOT NULL,
    status TEXT NOT NULL,
    body TEXT,
    created_by_agent TEXT NOT NULL,
    review_notes JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- events table
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
