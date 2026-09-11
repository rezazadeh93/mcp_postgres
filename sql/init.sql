CREATE TABLE programs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    university TEXT NOT NULL,
    program_name TEXT NOT NULL,
    country TEXT,
    city TEXT,
    degree_type TEXT,
    degree_level TEXT,
    program_url TEXT NOT NULL,

    subject_area TEXT,
    curriculum_summary TEXT,
    backend_fit SMALLINT,
    overall_fit SMALLINT,

    academic_eligibility TEXT,
    english_requirement TEXT,
    work_experience_requirement TEXT,

    application_start DATE,
    application_deadline DATE,
    intake TEXT,

    research_status TEXT NOT NULL DEFAULT 'discovered',
    eligibility_status TEXT NOT NULL DEFAULT 'unknown',

    uncertainties TEXT,
    source_urls TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],

    last_verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT programs_program_url_unique UNIQUE (program_url),

    CONSTRAINT backend_fit_range
        CHECK (
            backend_fit IS NULL
            OR backend_fit BETWEEN 0 AND 100
        ),

    CONSTRAINT overall_fit_range
        CHECK (
            overall_fit IS NULL
            OR overall_fit BETWEEN 0 AND 100
        ),

    CONSTRAINT research_status_values
        CHECK (
            research_status IN (
                'discovered',
                'researching',
                'researched',
                'verified',
                'rejected'
            )
        ),

    CONSTRAINT eligibility_status_values
        CHECK (
            eligibility_status IN (
                'unknown',
                'eligible',
                'likely_eligible',
                'conditional',
                'likely_ineligible',
                'ineligible'
            )
        )
);

CREATE INDEX programs_research_status_idx ON programs (research_status);
CREATE INDEX programs_overall_fit_idx ON programs (overall_fit DESC NULLS LAST);
CREATE INDEX programs_country_idx ON programs (country);

CREATE OR REPLACE FUNCTION set_programs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER programs_set_updated_at
    BEFORE UPDATE ON programs
    FOR EACH ROW
    EXECUTE FUNCTION set_programs_updated_at();
