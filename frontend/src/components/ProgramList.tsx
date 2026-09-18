import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchFilters, fetchPrograms, markVisited, setFlags } from '../api';
import { rowHighlightClass } from '../flags';
import type { Filters, FiltersResponse, Flag, Program, ProgramsResponse } from '../types';
import FilterBar from './FilterBar';
import FlagDropdown from './FlagDropdown';

const defaultFilters: Filters = {
  q: '',
  research_status: '',
  eligibility_status: '',
  country: '',
  min_overall_fit: '',
  sort: 'overall_fit',
  page: 1,
  per_page: 20,
};

function classForRow(program: Program): string {
  return rowHighlightClass(program.flags) || (program.visited_at ? 'visited' : '');
}

export default function ProgramList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState<Filters>(() => {
    return {
      ...defaultFilters,
      q: searchParams.get('q') || '',
      research_status: searchParams.get('research_status') || '',
      eligibility_status: searchParams.get('eligibility_status') || '',
      country: searchParams.get('country') || '',
      min_overall_fit: searchParams.get('min_overall_fit') || '',
      sort: searchParams.get('sort') || 'overall_fit',
      page: Number(searchParams.get('page')) || 1,
      per_page: Number(searchParams.get('per_page')) || 20,
    };
  });

  const [pendingFilters, setPendingFilters] = useState<Filters>(filters);
  const [data, setData] = useState<ProgramsResponse | null>(null);
  const [options, setOptions] = useState<FiltersResponse>({
    research_statuses: [],
    eligibility_statuses: [],
    flags: [],
    countries: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFilters().then(setOptions).catch(() => setError('Failed to load filter options'));
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchPrograms(filters)
      .then((res) => {
        setData(res);
        setFilters((f) => ({ ...f, page: res.page }));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [filters]);

  const applyFilters = () => {
    const next = { ...pendingFilters, page: 1 };
    setFilters(next);
    updateUrl(next);
  };

  const resetFilters = () => {
    setPendingFilters(defaultFilters);
    setFilters(defaultFilters);
    setSearchParams({});
  };

  const updateUrl = (next: Filters) => {
    const params = new URLSearchParams();
    if (next.q) params.set('q', next.q);
    if (next.research_status) params.set('research_status', next.research_status);
    if (next.eligibility_status) params.set('eligibility_status', next.eligibility_status);
    if (next.country) params.set('country', next.country);
    if (next.min_overall_fit) params.set('min_overall_fit', next.min_overall_fit);
    if (next.sort !== 'overall_fit') params.set('sort', next.sort);
    if (next.page > 1) params.set('page', String(next.page));
    if (next.per_page !== 20) params.set('per_page', String(next.per_page));
    setSearchParams(params);
  };

  const goToPage = (page: number) => {
    const next = { ...filters, page };
    setFilters(next);
    updateUrl(next);
  };

  const openProgram = (program: Program) => {
    markVisited(program.id).catch(() => {});
    navigate(`/program/${program.id}?${searchParams.toString()}`);
  };

  const updateFlagsForProgram = async (program: Program, flags: Flag[]) => {
    await setFlags(program.id, flags);
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        programs: prev.programs.map((p) =>
          p.id === program.id
            ? { ...p, flags, visited_at: p.visited_at || new Date().toISOString() }
            : p
        ),
      };
    });
  };

  const totalPages = data?.total_pages || 1;
  const page = data?.page || 1;

  return (
    <div>
      <header>
        <h1>Hermes Programs</h1>
        <p>Browse and filter the university program database.</p>
      </header>

      <FilterBar
        filters={pendingFilters}
        options={options}
        onChange={(partial) => setPendingFilters((f) => ({ ...f, ...partial }))}
        onApply={applyFilters}
        onReset={resetFilters}
      />

      <div className="toolbar">
        <div>
          <strong>{data?.total ?? 0}</strong> program{data?.total !== 1 ? 's' : ''}
          {page > 1 && (
            <span className="text-muted">
              {' '}
              · page {page} of {totalPages}
            </span>
          )}
        </div>
      </div>

      {error && <div className="card" style={{ color: 'var(--danger)' }}>{error}</div>}
      {loading && <div className="card">Loading…</div>}

      <div className="card">
        {data && data.programs.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th className="col-fit">ID</th>
                  <th>University</th>
                  <th>Program</th>
                  <th>Country</th>
                  <th>Degree</th>
                  <th className="text-right">Fit</th>
                  <th>Status</th>
                  <th>Eligibility</th>
                  <th>Deadline</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.programs.map((program) => (
                  <tr
                    key={program.id}
                    className={`clickable ${classForRow(program)}`}
                    onClick={() => openProgram(program)}
                  >
                    <td className="col-fit">{program.id}</td>
                    <td>{program.university}</td>
                    <td>{program.program_name}</td>
                    <td>{program.country ?? '-'}</td>
                    <td>{program.degree_level ?? '-'}</td>
                    <td className="text-right">{program.overall_fit ?? '-'}</td>
                    <td>
                      <span className={`badge badge-${program.research_status}`}>
                        {program.research_status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      <span className="badge">{program.eligibility_status.replace(/_/g, ' ')}</span>
                    </td>
                    <td>{program.application_deadline ?? '-'}</td>
                    <td className="col-fit">
                      <FlagDropdown
                        flags={program.flags}
                        onChange={(flags) => updateFlagsForProgram(program, flags)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <p>No programs match the current filters.</p>
            <button className="btn-secondary" onClick={resetFilters}>
              Clear filters
            </button>
          </div>
        )}

        {data && totalPages > 1 && (
          <div className="pagination">
            {page > 1 ? (
              <a href="#" onClick={(e) => { e.preventDefault(); goToPage(page - 1); }}>
                Previous
              </a>
            ) : (
              <span className="text-muted">Previous</span>
            )}

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
              if (p === 1 || p === totalPages || (p >= page - 2 && p <= page + 2)) {
                return p === page ? (
                  <span key={p} className="current">{p}</span>
                ) : (
                  <a key={p} href="#" onClick={(e) => { e.preventDefault(); goToPage(p); }}>
                    {p}
                  </a>
                );
              }
              if (p === page - 3 || p === page + 3) {
                return <span key={p} style={{ border: 'none' }}>…</span>;
              }
              return null;
            })}

            {page < totalPages ? (
              <a href="#" onClick={(e) => { e.preventDefault(); goToPage(page + 1); }}>
                Next
              </a>
            ) : (
              <span className="text-muted">Next</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
