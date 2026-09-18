export type Flag =
  | 'snooze'
  | 'important'
  | 'low_possibility'
  | 'medium_possibility'
  | 'high_possibility'
  | 'for_applying'
  | 'no_fit'
  | 'NOT_RELEVANT';

export interface Program {
  id: number;
  university: string;
  program_name: string;
  country: string | null;
  city: string | null;
  degree_type: string | null;
  degree_level: string | null;
  program_url: string;
  subject_area: string | null;
  curriculum_summary: string | null;
  backend_fit: number | null;
  overall_fit: number | null;
  academic_eligibility: string | null;
  english_requirement: string | null;
  work_experience_requirement: string | null;
  application_start: string | null;
  application_deadline: string | null;
  intake: string | null;
  research_status: string;
  eligibility_status: string;
  uncertainties: string | null;
  source_urls: string[];
  last_verified_at: string | null;
  created_at: string;
  updated_at: string;
  visited_at: string | null;
  flags: Flag[];
}

export interface ProgramsResponse {
  programs: Program[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface FiltersResponse {
  research_statuses: string[];
  eligibility_statuses: string[];
  flags: string[];
  countries: string[];
}

export interface Filters {
  q: string;
  research_status: string;
  eligibility_status: string;
  country: string;
  min_overall_fit: string;
  sort: string;
  page: number;
  per_page: number;
}
