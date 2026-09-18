-- Migration: convert single-marker program_tags.marker to a TEXT[] flags array.
-- Run this once against an existing hermes_db Postgres instance before restarting
-- the web service after the multi-flag update.

ALTER TABLE program_tags
    ADD COLUMN IF NOT EXISTS flags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE program_tags
SET flags = CASE marker
    WHEN 'want_to_apply' THEN ARRAY['for_applying']
    WHEN 'snooze' THEN ARRAY['snooze']
    WHEN 'important' THEN ARRAY['important']
    ELSE ARRAY[]::TEXT[]
END
WHERE marker IS NOT NULL;

ALTER TABLE program_tags DROP COLUMN IF EXISTS marker;
DROP INDEX IF EXISTS program_tags_marker_idx;

ALTER TABLE program_tags
    ADD CONSTRAINT program_tags_flags_values CHECK (
        flags <@ ARRAY[
            'snooze',
            'important',
            'low_possibility',
            'medium_possibility',
            'high_possibility',
            'for_applying',
            'no_fit',
            'NOT_RELEVANT'
        ]::TEXT[]
    );

CREATE INDEX IF NOT EXISTS program_tags_flags_idx ON program_tags USING GIN(flags);
