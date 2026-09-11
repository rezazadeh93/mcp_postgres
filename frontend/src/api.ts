import type { Filters, FiltersResponse, Program, ProgramsResponse } from './types';

const API_PREFIX = '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`${res.status} ${res.statusText}: ${body}`);
  }
  return res.json();
}

function buildQuery(filters: Partial<Filters>): string {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.research_status) params.set('research_status', filters.research_status);
  if (filters.eligibility_status) params.set('eligibility_status', filters.eligibility_status);
  if (filters.country) params.set('country', filters.country);
  if (filters.min_overall_fit) params.set('min_overall_fit', filters.min_overall_fit);
  if (filters.sort) params.set('sort', filters.sort);
  if (filters.page && filters.page > 1) params.set('page', String(filters.page));
  if (filters.per_page) params.set('per_page', String(filters.per_page));
  return params.toString();
}

export async function fetchPrograms(filters: Partial<Filters>): Promise<ProgramsResponse> {
  const qs = buildQuery(filters);
  return fetchJson<ProgramsResponse>(`${API_PREFIX}/programs${qs ? `?${qs}` : ''}`);
}

export async function fetchProgram(id: number): Promise<Program> {
  return fetchJson<Program>(`${API_PREFIX}/programs/${id}`);
}

export async function markVisited(id: number): Promise<void> {
  await fetchJson<{ visited: boolean }>(`${API_PREFIX}/programs/${id}/visit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
}

export async function setMarker(id: number, marker: string | null): Promise<void> {
  await fetchJson<{ marker: string | null }>(`${API_PREFIX}/programs/${id}/marker`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ marker }),
  });
}

export async function fetchFilters(): Promise<FiltersResponse> {
  return fetchJson<FiltersResponse>(`${API_PREFIX}/filters`);
}
