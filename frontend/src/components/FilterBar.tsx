import { useEffect, useRef, useState } from 'react';
import { FLAG_LABELS } from '../flags';
import type { Filters, FiltersResponse, Flag } from '../types';

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

function parseFlagFilter(value: string): Flag[] {
  return value
    .split(',')
    .map((f) => f.trim())
    .filter(Boolean) as Flag[];
}

function FlagFilterDropdown({
  flags,
  selected,
  onChange,
}: {
  flags: string[];
  selected: Flag[];
  onChange: (selected: Flag[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  const toggle = (flag: Flag) => {
    onChange(
      selected.includes(flag) ? selected.filter((f) => f !== flag) : [...selected, flag]
    );
  };

  const label = selected.length > 0 ? `Flags (${selected.length})` : 'All flags';

  return (
    <div className="flag-filter-dropdown" ref={ref}>
      <button
        type="button"
        className={`btn-sm ${selected.length > 0 ? 'active' : 'btn-secondary'}`}
        onClick={() => setOpen((prev) => !prev)}
      >
        {label} ▾
      </button>
      {open && (
        <div className="flag-filter-menu">
          {flags.map((flag) => (
            <label key={flag} className="flag-filter-option">
              <input
                type="checkbox"
                checked={selected.includes(flag as Flag)}
                onChange={() => toggle(flag as Flag)}
              />
              <span>{FLAG_LABELS[flag as Flag]}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

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
          <label>Flags</label>
          <FlagFilterDropdown
            flags={options.flags}
            selected={parseFlagFilter(filters.flags)}
            onChange={(selected) =>
              onChange({ flags: selected.join(','), page: 1 })
            }
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
          <label htmlFor="sort_dir">Order</label>
          <select
            id="sort_dir"
            value={filters.sort_dir}
            onChange={(e) =>
              onChange({ sort_dir: e.target.value as 'asc' | 'desc', page: 1 })
            }
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
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
