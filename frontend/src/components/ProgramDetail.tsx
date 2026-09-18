import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { fetchProgram, markVisited, setFlags } from '../api';
import type { Flag, Program } from '../types';
import FlagControls from './FlagControls';

function formatValue(value: string | number | string[] | null): string {
  if (value === null || value === undefined || value === '') return '-';
  if (Array.isArray(value)) return value.length ? value.join(', ') : '-';
  return String(value);
}

function renderUrl(url: string | null) {
  if (!url) return '-';
  return (
    <a href={url} target="_blank" rel="noopener noreferrer">
      {url}
    </a>
  );
}

export default function ProgramDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const programId = Number(id);
    if (!programId) {
      setError('Invalid program ID');
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchProgram(programId)
      .then(async (data) => {
        setProgram(data);
        if (!data.visited_at) {
          await markVisited(programId).catch(() => {});
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const updateFlagsForProgram = async (flags: Flag[]) => {
    if (!program) return;
    await setFlags(program.id, flags);
    setProgram((prev) =>
      prev ? { ...prev, flags, visited_at: prev.visited_at || new Date().toISOString() } : prev
    );
  };

  if (loading) return <div className="card">Loading…</div>;
  if (error) return <div className="card" style={{ color: 'var(--danger)' }}>{error}</div>;
  if (!program) return <div className="card">Program not found.</div>;

  const backUrl = `/?${searchParams.toString()}`;

  return (
    <div>
      <header>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1>{program.program_name}</h1>
            <p>
              {program.university}
              {program.country && `, ${program.country}`}
              {program.city && ` · ${program.city}`}
            </p>
          </div>
          <a href={backUrl} className="btn btn-secondary">← Back to list</a>
        </div>
      </header>

      <div className="card">
        <div className="marker-bar">
          <FlagControls flags={program.flags} onChange={updateFlagsForProgram} />
        </div>
      </div>

      <div className="card">
        <dl className="detail-grid">
          <dt>ID</dt>
          <dd>{program.id}</dd>

          <dt>Program URL</dt>
          <dd>{renderUrl(program.program_url)}</dd>

          <dt>Degree</dt>
          <dd>
            {program.degree_level ?? '-'}
            {program.degree_type && ` (${program.degree_type})`}
          </dd>

          <dt>Subject area</dt>
          <dd>{formatValue(program.subject_area)}</dd>

          <dt>Backend fit</dt>
          <dd>{formatValue(program.backend_fit)}</dd>

          <dt>Overall fit</dt>
          <dd>{formatValue(program.overall_fit)}</dd>

          <dt>Research status</dt>
          <dd>
            <span className={`badge badge-${program.research_status}`}>
              {program.research_status.replace(/_/g, ' ')}
            </span>
          </dd>

          <dt>Eligibility status</dt>
          <dd>
            <span className="badge">{program.eligibility_status.replace(/_/g, ' ')}</span>
          </dd>

          <dt>Academic eligibility</dt>
          <dd style={{ whiteSpace: 'pre-wrap' }}>{formatValue(program.academic_eligibility)}</dd>

          <dt>English requirement</dt>
          <dd style={{ whiteSpace: 'pre-wrap' }}>{formatValue(program.english_requirement)}</dd>

          <dt>Work experience</dt>
          <dd style={{ whiteSpace: 'pre-wrap' }}>{formatValue(program.work_experience_requirement)}</dd>

          <dt>Application start</dt>
          <dd>{formatValue(program.application_start)}</dd>

          <dt>Application deadline</dt>
          <dd>{formatValue(program.application_deadline)}</dd>

          <dt>Intake</dt>
          <dd>{formatValue(program.intake)}</dd>

          <dt>Curriculum summary</dt>
          <dd style={{ whiteSpace: 'pre-wrap' }}>{formatValue(program.curriculum_summary)}</dd>

          <dt>Uncertainties</dt>
          <dd style={{ whiteSpace: 'pre-wrap' }}>{formatValue(program.uncertainties)}</dd>

          <dt>Source URLs</dt>
          <dd>
            {program.source_urls.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {program.source_urls.map((url, idx) => (
                  <li key={idx}>{renderUrl(url)}</li>
                ))}
              </ul>
            ) : (
              '-'
            )}
          </dd>

          <dt>Last verified</dt>
          <dd>{formatValue(program.last_verified_at)}</dd>

          <dt>Created</dt>
          <dd>{formatValue(program.created_at)}</dd>

          <dt>Updated</dt>
          <dd>{formatValue(program.updated_at)}</dd>

          <dt>Visited</dt>
          <dd>{program.visited_at ? formatValue(program.visited_at) : 'Not yet visited'}</dd>
        </dl>
      </div>

      <div style={{ marginTop: 16 }}>
        <a href={backUrl} className="btn btn-secondary">← Back to list</a>
      </div>
    </div>
  );
}
