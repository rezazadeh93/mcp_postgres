-- Migration: add per-program visit / marker tracking for the React web UI.
-- Run this once against an existing hermes_db Postgres instance before starting
-- the web service.

CREATE TABLE IF NOT EXISTS program_tags (
    program_id BIGINT PRIMARY KEY REFERENCES programs(id) ON DELETE CASCADE,
    visited_at TIMESTAMPTZ,
    marker TEXT CHECK (marker IN ('snooze', 'important', 'want_to_apply')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS program_tags_marker_idx ON program_tags(marker);

CREATE OR REPLACE FUNCTION set_program_tags_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS program_tags_set_updated_at ON program_tags;
CREATE TRIGGER program_tags_set_updated_at
    BEFORE UPDATE ON program_tags
    FOR EACH ROW
    EXECUTE FUNCTION set_program_tags_updated_at();
