/**
 * Typed API client for Faculty DSS backend.
 * Automatically injects the Clerk Bearer token from the browser session.
 *
 * All calls use relative URLs (/api/v1/...) which are proxied to the FastAPI
 * backend by the Next.js rewrite rule in next.config.ts. This eliminates CORS
 * entirely — no cross-origin requests are made from the browser.
 */

// Relative path — Next.js rewrites proxy /api/v1/* → http://localhost:8000/api/v1/*
// To call the backend directly (e.g. server components), set NEXT_PUBLIC_API_URL.
const API_URL = "";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ApplicantStatus = "pending" | "shortlisted" | "rejected" | "hired";
export type HighestDegree = "bachelors" | "masters" | "doctorate" | "post_doctorate";

export interface Applicant {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  highest_degree: HighestDegree;
  dynamic_data: Record<string, any>;
  specialization: string | null;
  teaching_units_available: number;
  applied_position_id: string | null;
  status: ApplicantStatus;
  is_internal: boolean;
  mcdm_score: number | null;
  created_at: string;
  updated_at?: string;
}

export interface ApplicantCreate {
  first_name: string;
  last_name: string;
  email: string;
  highest_degree: HighestDegree;
  dynamic_data?: Record<string, any>;
  specialization?: string;
  teaching_units_available?: number;
  applied_position_id?: string | null;
  status?: ApplicantStatus;
  is_internal?: boolean;
}

export interface Criteria {
  id: string;
  name: string;
  description: string | null;
  weight: number;
  data_key: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CriteriaCreate {
  name: string;
  description?: string;
  weight: number;
  data_key: string;
  is_active?: boolean;
}

export interface WeightSummary {
  total_weight: number;
  is_valid: boolean;
  active_count: number;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description: string | null;
  created_at: string;
}

export interface Position {
  id: string;
  title: string;
  department_id: string;
  required_units: number;
  requires_phd: boolean;
  description: string | null;
  is_open: boolean;
  created_at: string;
  department: Department | null;
}

export interface ApplicantStats {
  total: number;
  pending: number;
  shortlisted: number;
  rejected: number;
  hired: number;
}

export interface DashboardStats {
  total_applicants: number;
  shortlisted: number;
  pending: number;
  hired: number;
  open_positions: number;
  active_criteria: number;
  evaluations_run: number;
  total_allocations: number;
  score_distribution: { name: string; count: number }[];
  department_allocations: { department: string; allocations: number }[];
}

// ── HTTP helper ───────────────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  token: string,
  options: RequestInit = {},
): Promise<T> {
  let res: Response;

  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers ?? {}),
      },
    });
  } catch (err: unknown) {
    // Network-level failure (connection refused, proxy down, etc.)
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Cannot reach the backend server. Is uvicorn running? (${msg})`);
  }

  // 204 No Content — no body to parse
  if (res.status === 204) return undefined as unknown as T;

  // Detect whether the response body is JSON
  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");

  if (!isJson) {
    // Non-JSON response (HTML error page from Next.js proxy or server crash)
    const text = await res.text().catch(() => res.statusText);
    throw new Error(
      `Server returned ${res.status} with a non-JSON body. ` +
      `This usually means the backend crashed or a migration is missing. ` +
      `Hint: ${text.slice(0, 120)}`,
    );
  }

  const data = await res.json();

  if (!res.ok) {
    // FastAPI validation / business logic errors come with a `detail` field
    const detail =
      typeof data?.detail === "string"
        ? data.detail
        : Array.isArray(data?.detail)
        ? data.detail.map((d: { msg?: string }) => d.msg ?? JSON.stringify(d)).join("; ")
        : `Request failed: ${res.status}`;
    throw new Error(detail);
  }

  return data as T;
}

// ── Applicants ────────────────────────────────────────────────────────────────

export const applicantsApi = {
  list: (token: string, status?: ApplicantStatus) =>
    apiFetch<Applicant[]>(
      `/api/v1/applicants${status ? `?status=${status}` : ""}`,
      token,
    ),

  stats: (token: string) =>
    apiFetch<ApplicantStats>("/api/v1/applicants/stats", token),

  create: (token: string, data: ApplicantCreate) =>
    apiFetch<Applicant>("/api/v1/applicants", token, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (token: string, id: string, data: Partial<ApplicantCreate>) =>
    apiFetch<Applicant>(`/api/v1/applicants/${id}`, token, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  remove: (token: string, id: string) =>
    apiFetch<void>(`/api/v1/applicants/${id}`, token, { method: "DELETE" }),
};

// ── Criteria ──────────────────────────────────────────────────────────────────

export const criteriaApi = {
  list: (token: string) =>
    apiFetch<Criteria[]>("/api/v1/criteria", token),

  weightSummary: (token: string) =>
    apiFetch<WeightSummary>("/api/v1/criteria/weight-summary", token),

  create: (token: string, data: CriteriaCreate) =>
    apiFetch<Criteria>("/api/v1/criteria", token, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (token: string, id: string, data: Partial<CriteriaCreate>) =>
    apiFetch<Criteria>(`/api/v1/criteria/${id}`, token, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  remove: (token: string, id: string) =>
    apiFetch<void>(`/api/v1/criteria/${id}`, token, { method: "DELETE" }),
};

// ── Departments ───────────────────────────────────────────────────────────────

export interface DepartmentCreate {
  name: string;
  code: string;
  description?: string;
}

export const departmentsApi = {
  list: (token: string) =>
    apiFetch<Department[]>("/api/v1/departments", token),

  create: (token: string, data: DepartmentCreate) =>
    apiFetch<Department>("/api/v1/departments", token, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (token: string, id: string, data: Partial<DepartmentCreate>) =>
    apiFetch<Department>(`/api/v1/departments/${id}`, token, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  remove: (token: string, id: string) =>
    apiFetch<void>(`/api/v1/departments/${id}`, token, { method: "DELETE" }),
};

// ── Positions ─────────────────────────────────────────────────────────────────

export interface PositionCreate {
  title: string;
  department_id: string;
  required_units?: number;
  requires_phd?: boolean;
  description?: string;
  is_open?: boolean;
}

export const positionsApi = {
  list: (token: string, department_id?: string) =>
    apiFetch<Position[]>(
      `/api/v1/positions${department_id ? `?department_id=${department_id}` : ""}`,
      token,
    ),

  create: (token: string, data: PositionCreate) =>
    apiFetch<Position>("/api/v1/positions", token, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (token: string, id: string, data: Partial<PositionCreate>) =>
    apiFetch<Position>(`/api/v1/positions/${id}`, token, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  remove: (token: string, id: string) =>
    apiFetch<void>(`/api/v1/positions/${id}`, token, { method: "DELETE" }),
};

// ── Evaluation ────────────────────────────────────────────────────────────────

export interface CriteriaBreakdown {
  criteria_id: string;
  criteria_name: string;
  data_key: string;
  weight: number;
  raw_value: number;
  normalized_value: number;
  weighted_score: number;
}

export interface ApplicantRanking {
  rank: number;
  applicant_id: string;
  first_name: string;
  last_name: string;
  email: string;
  status: string;
  mcdm_score: number;
  breakdown: CriteriaBreakdown[];
}

export interface EvaluationResult {
  total_applicants: number;
  criteria_count: number;
  total_weight: number;
  rankings: ApplicantRanking[];
  evaluated_at: string;
  scores_saved: boolean;
}

export interface RunEvaluationRequest {
  save_scores?: boolean;
  custom_weights?: Record<string, number>;
  include_statuses?: string[];
  applicant_type?: "external" | "internal" | "both";
}

export const evaluationApi = {
  run: (token: string, req: RunEvaluationRequest = {}) =>
    apiFetch<EvaluationResult>("/api/v1/evaluation/run", token, {
      method: "POST",
      body: JSON.stringify({ save_scores: true, include_statuses: ["pending", "shortlisted"], ...req }),
    }),

  results: (token: string) =>
    apiFetch<Array<{ rank: number; applicant_id: string; name: string; email: string; status: string; mcdm_score: number }>>("/api/v1/evaluation/results", token),
};

// ── Optimization ──────────────────────────────────────────────────────────────

export interface AllocationItem {
  applicant_id: string;
  applicant_name: string;
  position_id: string;
  position_title: string;
  department_name: string | null;
  alignment_score: number;
  teaching_units: number;
}

export interface OptimizationResult {
  status: string;
  total_score: number;
  allocation_count: number;
  allocations: AllocationItem[];
  unallocated_applicant_names: string[];
  unfilled_position_titles: string[];
  solver_message: string;
  solved_at: string;
  scores_saved: boolean;
}

export interface RunOptimizationRequest {
  save_allocations?: boolean;
  maximize_coverage?: boolean;
  custom_weights?: Record<string, number>;
  position_ids?: string[];
  applicant_ids?: string[];
  applicant_type?: "external" | "internal" | "both";
}

export interface CommitAllocationItem {
  applicant_id: string;
  position_id: string;
  teaching_units: number;
  alignment_score: number;
}

export interface CommitOptimizationRequest {
  allocations: CommitAllocationItem[];
}

export const optimizationApi = {
  run: (token: string, req: RunOptimizationRequest = {}) =>
    apiFetch<OptimizationResult>("/api/v1/optimization/run", token, {
      method: "POST",
      body: JSON.stringify({ save_allocations: true, ...req }),
    }),

  simulate: (token: string, req: RunOptimizationRequest = {}) =>
    apiFetch<OptimizationResult>("/api/v1/optimization/simulate", token, {
      method: "POST",
      body: JSON.stringify({ save_allocations: false, ...req }),
    }),

  commit: (token: string, req: CommitOptimizationRequest) =>
    apiFetch<{ status: string; count: number; message: string }>("/api/v1/optimization/commit", token, {
      method: "POST",
      body: JSON.stringify(req),
    }),
};

// ── Health & Dashboard ─────────────────────────────────────────────────────────

export const healthApi = {
  check: () => fetch(`${API_URL}/api/v1/health`).then(res => res.json()),
  dashboardStats: (token: string) => apiFetch<DashboardStats>("/api/v1/health/dashboard-stats", token),
};
