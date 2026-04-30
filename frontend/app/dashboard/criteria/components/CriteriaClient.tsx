"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { Plus, RefreshCw, CheckCircle, AlertTriangle } from "lucide-react";
import { criteriaApi, type Criteria, type WeightSummary } from "@/lib/api";
import { CriteriaModal } from "./CriteriaModal";

const DATA_KEY_LABELS: Record<string, string> = {
  years_experience: "Years of Experience",
  research_outputs: "Research Outputs",
  certifications: "Certifications",
  highest_degree: "Highest Degree",
  teaching_units_available: "Teaching Units Available",
};

export function CriteriaClient() {
  const { getToken } = useAuth();

  const [criteria, setCriteria] = useState<Criteria[]>([]);
  const [summary, setSummary] = useState<WeightSummary>({ total_weight: 0, is_valid: false, active_count: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Criteria | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) return;
      const [list, ws] = await Promise.all([
        criteriaApi.list(token),
        criteriaApi.weightSummary(token),
      ]);
      setCriteria(list);
      setSummary(ws);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load criteria.");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this criteria? This cannot be undone.")) return;
    const token = await getToken();
    if (!token) return;
    await criteriaApi.remove(token, id);
    load();
  };

  const handleToggleActive = async (c: Criteria) => {
    setTogglingId(c.id);
    const token = await getToken();
    if (!token) return;
    try {
      await criteriaApi.update(token, c.id, { is_active: !c.is_active });
      load();
    } finally {
      setTogglingId(null);
    }
  };

  const totalPct = summary.total_weight;
  const barColor = summary.is_valid
    ? "var(--color-success)"
    : totalPct > 100
    ? "var(--color-danger)"
    : "var(--color-warning)";

  return (
    <>
      {/* ── Weight Status Banner ─────────────────────────── */}
      <div
        className="card"
        style={{ marginBottom: "1.5rem", padding: "1.25rem 1.5rem" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {summary.is_valid ? (
              <CheckCircle size={18} color="var(--color-success)" />
            ) : (
              <AlertTriangle size={18} color={totalPct > 100 ? "var(--color-danger)" : "var(--color-warning)"} />
            )}
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}>
                Total Weight:{" "}
                <span style={{ color: barColor }}>{totalPct.toFixed(1)}%</span>
              </div>
              <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 2 }}>
                {summary.is_valid
                  ? `${summary.active_count} active criteria — weights are balanced ✓`
                  : totalPct > 100
                  ? "Weights exceed 100% — reduce some criteria weights"
                  : `${(100 - totalPct).toFixed(1)}% remaining — weights must sum to exactly 100%`}
              </div>
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: barColor }}>{totalPct.toFixed(1)}%</div>
        </div>

        {/* Progress bar */}
        <div
          style={{
            height: 8,
            background: "var(--color-bg-elevated)",
            borderRadius: 999,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${Math.min(totalPct, 100)}%`,
              background: summary.is_valid ? "var(--gradient-brand)" : barColor,
              borderRadius: 999,
              transition: "width 0.5s ease, background 0.3s ease",
              boxShadow: summary.is_valid ? "var(--shadow-accent)" : "none",
            }}
          />
        </div>
      </div>

      {/* ── Toolbar ──────────────────────────────────────── */}
      <div
        style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginBottom: "1rem" }}
      >
        <button
          id="criteria-refresh-btn"
          className="btn btn-ghost"
          onClick={load}
          style={{ padding: "0.55rem 0.8rem" }}
        >
          <RefreshCw size={14} />
        </button>
        <button
          id="criteria-add-btn"
          className="btn btn-primary"
          onClick={() => { setEditTarget(null); setModalOpen(true); }}
        >
          <Plus size={15} /> Add Criteria
        </button>
      </div>

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
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--color-text-muted)" }}>
            Loading criteria…
          </div>
        ) : criteria.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center" }}>
            <p style={{ color: "var(--color-text-muted)", marginBottom: 12 }}>
              No criteria defined yet. Add your first evaluation criterion.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => { setEditTarget(null); setModalOpen(true); }}
            >
              <Plus size={14} /> Add First Criteria
            </button>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
                {["Criteria Name", "Evaluates", "Weight", "Active", "Actions"].map((h) => (
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
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {criteria.map((c, i) => (
                <tr
                  key={c.id}
                  style={{
                    borderBottom: i < criteria.length - 1 ? "1px solid var(--color-border-subtle)" : "none",
                    opacity: c.is_active ? 1 : 0.5,
                    transition: "all var(--transition-fast)",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-bg-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "var(--color-text-primary)" }}>
                      {c.name}
                    </div>
                    {c.description && (
                      <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 2 }}>
                        {c.description}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span className="badge badge-accent" style={{ fontSize: 10 }}>
                      {DATA_KEY_LABELS[c.data_key] ?? c.data_key}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {/* Mini weight bar */}
                      <div
                        style={{
                          width: 80,
                          height: 6,
                          background: "var(--color-bg-elevated)",
                          borderRadius: 999,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${Math.min(c.weight, 100)}%`,
                            background: "var(--gradient-brand)",
                            borderRadius: 999,
                          }}
                        />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)", minWidth: 36 }}>
                        {c.weight}%
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    {/* Toggle switch */}
                    <button
                      id={`criteria-toggle-${c.id}`}
                      onClick={() => handleToggleActive(c)}
                      disabled={togglingId === c.id}
                      style={{
                        width: 40,
                        height: 22,
                        borderRadius: 999,
                        border: "none",
                        background: c.is_active ? "var(--color-accent)" : "var(--color-bg-muted)",
                        position: "relative",
                        cursor: "pointer",
                        transition: "background var(--transition-fast)",
                      }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          top: 3,
                          left: c.is_active ? 21 : 3,
                          width: 16,
                          height: 16,
                          borderRadius: "50%",
                          background: "#fff",
                          transition: "left var(--transition-fast)",
                        }}
                      />
                    </button>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        id={`criteria-edit-${c.id}`}
                        className="btn btn-ghost"
                        style={{ padding: "4px 10px", fontSize: 12 }}
                        onClick={() => { setEditTarget(c); setModalOpen(true); }}
                      >
                        Edit
                      </button>
                      <button
                        id={`criteria-delete-${c.id}`}
                        className="btn btn-danger"
                        style={{ padding: "4px 10px", fontSize: 12 }}
                        onClick={() => handleDelete(c.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Modal ────────────────────────────────────────── */}
      {modalOpen && (
        <CriteriaModal
          existing={editTarget}
          onClose={() => setModalOpen(false)}
          onSaved={() => { setModalOpen(false); load(); }}
        />
      )}
    </>
  );
}
