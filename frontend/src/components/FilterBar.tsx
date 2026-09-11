import type { Filters, FiltersResponse } from '../types';

interface FilterBarProps {
  filters: Filters;
  options: FiltersResponse;
  onChange: (filters: Partial<Filters>) => void;
  onApply: () => void;
  onReset: () => void;
}

const sortOptions = [
  { value: 'overall_fit', label: 'Fit score' },
  { value: 'university', label: 'University' },
  { value: 'program_name', label: 'Program' },
  { value: 'country', label: 'Country' },
  { value: 'application_deadline', label: 'Deadline' },
  { value: 'created_at', label: 'Created' },
  { value: 'id', label: 'ID' },
];

const perPageOptions = [10, 20, 50, 100];

export default function FilterBar({ filters, options, onChange, onApply, onReset }: FilterBarProps) {
  return (
    <div className="card">
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="q">Search</label>
          <input
            id="q"
            type="text"
            value={filters.q}
            placeholder="University or program name"
            onChange={(e) => onChange({ q: e.target.value, page: 1 })}
          />
        </div>

        <div className="form-group">
          <label htmlFor="research_status">Research status</label>
          <select
            id="research_status"
            value={filters.research_status}
            onChange={(e) => onChange({ research_status: e.target.value, page: 1 })}
          >
            <option value="">All</option>
            {options.research_statuses.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="eligibility_status">Eligibility status</label>
          <select
            id="eligibility_status"
            value={filters.eligibility_status}
            onChange={(e) => onChange({ eligibility_status: e.target.value, page: 1 })}
          >
            <option value="">All</option>
            {options.eligibility_statuses.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="country">Country</label>
          <input
            id="country"
            type="text"
            value={filters.country}
            list="country-list"
            placeholder="Filter by country"
            onChange={(e) => onChange({ country: e.target.value, page: 1 })}
          />
          <datalist id="country-list">
            {options.countries.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>

        <div className="form-group">
          <label htmlFor="min_overall_fit">Min fit score</label>
          <input
            id="min_overall_fit"
            type="number"
            min="0"
            max="100"
            value={filters.min_overall_fit}
            onChange={(e) => onChange({ min_overall_fit: e.target.value, page: 1 })}
          />
        </div>

        <div className="form-group">
          <label htmlFor="sort">Sort by</label>
          <select
            id="sort"
            value={filters.sort}
            onChange={(e) => onChange({ sort: e.target.value, page: 1 })}
          >
            {sortOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="per_page">Per page</label>
          <select
            id="per_page"
            value={filters.per_page}
            onChange={(e) => onChange({ per_page: Number(e.target.value), page: 1 })}
          >
            {perPageOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group" style={{ flex: 0 }}>
          <button className="btn-primary" onClick={onApply}>
            Filter
          </button>
          <button className="btn-secondary" onClick={onReset}>
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
