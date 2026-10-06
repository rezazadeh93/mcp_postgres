-- Migration: add a free-text tuition fee on programs (shown in the list UI).
-- Run this once against an existing hermes_db Postgres instance before restarting
-- the web and MCP services after the tuition fee update.

ALTER TABLE programs
    ADD COLUMN IF NOT EXISTS tuition_fee TEXT;
