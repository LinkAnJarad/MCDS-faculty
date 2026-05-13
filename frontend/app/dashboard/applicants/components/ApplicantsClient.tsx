"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { UserPlus, Search, RefreshCw } from "lucide-react";
import { applicantsApi, type Applicant, type ApplicantStatus } from "@/lib/api";
import { ApplicantModal } from "./ApplicantModal";

const STATUS_COLORS: Record<ApplicantStatus, string> = {
  pending: "var(--color-info)",
  shortlisted: "var(--color-warning)",
  rejected: "var(--color-danger)",
  hired: "var(--color-success)",
};

const DEGREE_LABELS: Record<string, string> = {
  bachelors: "Bachelor's",
  masters: "Master's",
  doctorate: "Doctorate",
  post_doctorate: "Post-Doc",
};

const STATUS_OPTIONS: { value: ApplicantStatus | "all"; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "rejected", label: "Rejected" },
  { value: "hired", label: "Hired" },
];

export function ApplicantsClient() {
  const { getToken } = useAuth();

  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApplicantStatus | "all">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Applicant | null>(null);
  const [stats, setStats] = useState({ total: 0, pending: 0, shortlisted: 0, hired: 0 });
  const [currentTab, setCurrentTab] = useState<"applicants" | "hired">("applicants");

  const loadApplicants = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) return;
      const [list, s] = await Promise.all([
        applicantsApi.list(token, statusFilter === "all" ? undefined : statusFilter),
        applicantsApi.stats(token),
      ]);
      setApplicants(list);
      setStats(s);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load applicants.");
    } finally {
      setLoading(false);
    }
  }, [getToken, statusFilter]);

  useEffect(() => { loadApplicants(); }, [loadApplicants]);

  const filtered = applicants.filter((a) => {
    // Tab filter
    const isHiredOrInternal = a.status === "hired" || a.is_internal;
    if (currentTab === "hired" && !isHiredOrInternal) return false;
    if (currentTab === "applicants" && isHiredOrInternal) return false;

    const q = search.toLowerCase();
    return (
      a.first_name.toLowerCase().includes(q) ||
      a.last_name.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      (a.specialization ?? "").toLowerCase().includes(q)
    );
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this applicant? This cannot be undone.")) return;
    const token = await getToken();
    if (!token) return;
    await applicantsApi.remove(token, id);
    loadApplicants();
  };

  // ── KPI row ──────────────────────────────────────────────────────────────
  const kpis = [
    { label: "Total Applicants", value: stats.total, color: "var(--color-accent)" },
    { label: "Pending Review", value: stats.pending, color: "var(--color-info)" },
    { label: "Shortlisted", value: stats.shortlisted, color: "var(--color-warning)" },
    { label: "Hired", value: stats.hired, color: "var(--color-success)" },
  ];

  return (
    <>
      {/* ── KPI Cards ──────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        {kpis.map((k) => (
          <div key={k.label} className="card" style={{ padding: "1.1rem" }}>
            <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginBottom: 6, fontWeight: 500 }}>
              {k.label}
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: k.color }}>
              {loading ? "—" : k.value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabs ───────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", borderBottom: "1px solid var(--color-border-subtle)", paddingBottom: "0.5rem" }}>
        <button
          className={`btn ${currentTab === "applicants" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setCurrentTab("applicants")}
        >
          Applicants
        </button>
        <button
          className={`btn ${currentTab === "hired" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setCurrentTab("hired")}
        >
          Hired Staff
        </button>
      </div>

      {/* ── Toolbar ────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: "1rem",
          flexWrap: "wrap",
        }}
      >
        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search
            size={14}
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--color-text-muted)",
            }}
          />
          <input
            id="applicants-search"
            className="input"
            placeholder="Search name, email, specialization…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 32 }}
          />
        </div>

        {/* Status filter */}
        {currentTab === "applicants" && (
          <select
            id="applicants-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ApplicantStatus | "all")}
            className="input"
            style={{ width: 160 }}
          >
            {STATUS_OPTIONS.filter(o => o.value !== "hired").map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        )}

        {/* Refresh */}
        <button
          id="applicants-refresh-btn"
          className="btn btn-ghost"
          onClick={loadApplicants}
          title="Refresh"
          style={{ padding: "0.55rem 0.8rem" }}
        >
          <RefreshCw size={14} className={loading ? "spin" : ""} />
        </button>

        {/* Add */}
        <button
          id="applicants-add-btn"
          className="btn btn-primary"
          onClick={() => { setEditTarget(null); setModalOpen(true); }}
        >
          <UserPlus size={15} /> Add Applicant
        </button>
      </div>

      {/* ── Error ──────────────────────────────────────────── */}
      {error && (
        <div
          style={{
            padding: "12px 16px",
            background: "hsla(0,72%,60%,0.12)",
            border: "1px solid hsla(0,72%,60%,0.3)",
            borderRadius: "var(--radius-md)",
            color: "var(--color-danger)",
            fontSize: 13,
            marginBottom: "1rem",
          }}
        >
          {error}
        </div>
      )}

      {/* ── Table ──────────────────────────────────────────── */}
      <div
        className="card"
        style={{ padding: 0, overflow: "hidden" }}
      >
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--color-text-muted)" }}>
            Loading applicants…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center" }}>
            <p style={{ color: "var(--color-text-muted)", marginBottom: 12 }}>
              {search || statusFilter !== "all" ? "No applicants match your filter." : "No applicants yet."}
            </p>
            {!search && statusFilter === "all" && (
              <button
                className="btn btn-primary"
                onClick={() => { setEditTarget(null); setModalOpen(true); }}
              >
                <UserPlus size={14} /> Add First Applicant
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
                  {["Name", "Email", "Degree", "Exp (yrs)", "Research", "Certs", "Status", "Score", "Actions"].map(
                    (h) => (
                      <th
                        key={h}
                        style={{
                          padding: "10px 16px",
                          textAlign: "left",
                          fontSize: 11,
                          fontWeight: 600,
                          color: "var(--color-text-muted)",
                          letterSpacing: "0.05em",
                          textTransform: "uppercase",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((a, i) => (
                  <tr
                    key={a.id}
                    style={{
                      borderBottom: i < filtered.length - 1 ? "1px solid var(--color-border-subtle)" : "none",
                      transition: "background var(--transition-fast)",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "var(--color-bg-hover)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "var(--color-text-primary)" }}>
                        {a.first_name} {a.last_name}
                        {a.is_internal && <span style={{ marginLeft: 6, fontSize: 10, padding: "2px 6px", background: "var(--color-bg-hover)", borderRadius: 4 }}>Internal</span>}
                      </div>
                      {a.specialization && (
                        <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 1 }}>
                          {a.specialization}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--color-text-secondary)" }}>
                      {a.email}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13 }}>
                      {DEGREE_LABELS[a.highest_degree] ?? a.highest_degree}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, textAlign: "center" }}>
                      {a.dynamic_data?.years_experience ?? 0}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, textAlign: "center" }}>
                      {a.dynamic_data?.research_outputs ?? 0}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, textAlign: "center" }}>
                      {a.dynamic_data?.certifications ?? 0}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        className="badge"
                        style={{
                          background: `${STATUS_COLORS[a.status]}20`,
                          color: STATUS_COLORS[a.status],
                          textTransform: "capitalize",
                        }}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, textAlign: "center", color: "var(--color-text-muted)" }}>
                      {a.mcdm_score != null ? a.mcdm_score.toFixed(3) : "—"}
                    </td>
                    <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          id={`applicant-edit-${a.id}`}
                          className="btn btn-ghost"
                          style={{ padding: "4px 10px", fontSize: 12 }}
                          onClick={() => { setEditTarget(a); setModalOpen(true); }}
                        >
                          Edit
                        </button>
                        <button
                          id={`applicant-delete-${a.id}`}
                          className="btn btn-danger"
                          style={{ padding: "4px 10px", fontSize: 12 }}
                          onClick={() => handleDelete(a.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal ──────────────────────────────────────────── */}
      {modalOpen && (
        <ApplicantModal
          existing={editTarget}
          onClose={() => setModalOpen(false)}
          onSaved={() => { setModalOpen(false); loadApplicants(); }}
        />
      )}
    </>
  );
}
