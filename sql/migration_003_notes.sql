-- Migration: add a free-text note on program_tags (used in the flags UI).
-- Run this once against an existing hermes_db Postgres instance before restarting
-- the web service after the notes update.

ALTER TABLE program_tags
    ADD COLUMN IF NOT EXISTS note TEXT NOT NULL DEFAULT '';
