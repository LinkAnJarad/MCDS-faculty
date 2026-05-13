"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  Play,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertCircle,
  Trophy,
  Medal,
  Award,
  FileDown,
  FileSpreadsheet,
  Lightbulb,
} from "lucide-react";
import {
  evaluationApi,
  type EvaluationResult,
  type ApplicantRanking,
} from "@/lib/api";
import { exportEvaluationPDF, exportEvaluationExcel } from "@/lib/export";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  shortlisted: "Shortlisted",
  rejected: "Rejected",
  hired: "Hired",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "var(--color-info)",
  shortlisted: "var(--color-warning)",
  rejected: "var(--color-danger)",
  hired: "var(--color-success)",
};

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: "linear-gradient(135deg, hsl(45,98%,55%), hsl(35,98%,45%))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 0 12px hsla(45,98%,55%,0.5)",
        }}
      >
        <Trophy size={16} color="#fff" />
      </div>
    );
  if (rank === 2)
    return (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: "linear-gradient(135deg, hsl(210,15%,72%), hsl(210,15%,60%))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Medal size={16} color="#fff" />
      </div>
    );
  if (rank === 3)
    return (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: "linear-gradient(135deg, hsl(30,80%,55%), hsl(20,80%,45%))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Award size={16} color="#fff" />
      </div>
    );
  return (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: "50%",
        background: "var(--color-bg-elevated)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 12,
        fontWeight: 700,
        color: "var(--color-text-muted)",
      }}
    >
      {rank}
    </div>
  );
}

function ScoreBar({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(100, score));
  const color =
    pct >= 75
      ? "var(--color-success)"
      : pct >= 50
      ? "var(--color-warning)"
      : pct >= 25
      ? "var(--color-info)"
      : "var(--color-danger)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div
        style={{
          flex: 1,
          height: 6,
          background: "var(--color-bg-elevated)",
          borderRadius: 999,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: color,
            borderRadius: 999,
            transition: "width 0.6s ease",
            boxShadow: `0 0 6px ${color}60`,
          }}
        />
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color, minWidth: 44, textAlign: "right" }}>
        {pct.toFixed(2)}
      </span>
    </div>
  );
}

function BreakdownRow({ ranking }: { ranking: ApplicantRanking }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <tr
        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-bg-hover)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        style={{ cursor: "pointer", transition: "background var(--transition-fast)" }}
        onClick={() => setOpen((o) => !o)}
      >
        <td style={{ padding: "12px 16px" }}>
          <RankBadge rank={ranking.rank} />
        </td>
        <td style={{ padding: "12px 16px" }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: "var(--color-text-primary)" }}>
            {ranking.first_name} {ranking.last_name}
          </div>
          <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 1 }}>
            {ranking.email}
          </div>
        </td>
        <td style={{ padding: "12px 16px" }}>
          <span
            className="badge"
            style={{
              background: `${STATUS_COLORS[ranking.status] ?? "var(--color-accent)"}20`,
              color: STATUS_COLORS[ranking.status] ?? "var(--color-accent)",
              textTransform: "capitalize",
            }}
          >
            {STATUS_LABELS[ranking.status] ?? ranking.status}
          </span>
        </td>
        <td style={{ padding: "12px 16px", width: 220 }}>
          <ScoreBar score={ranking.mcdm_score} />
        </td>
        <td style={{ padding: "12px 16px", textAlign: "center", color: "var(--color-text-muted)" }}>
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </td>
      </tr>
      {open && (
        <tr>
          <td colSpan={5} style={{ padding: 0, background: "var(--color-bg-elevated)" }}>
            <div style={{ padding: "12px 60px 16px" }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", marginBottom: 10, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                Criteria Breakdown
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {ranking.breakdown.map((b) => (
                  <div key={b.criteria_id} style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 80px", gap: 12, alignItems: "center" }}>
                    <div>
                      <span style={{ fontSize: 12, color: "var(--color-text-secondary)", fontWeight: 500 }}>{b.criteria_name}</span>
                      <span
                        className="badge badge-accent"
                        style={{ marginLeft: 8, fontSize: 9 }}
                      >
                        {b.weight}%
                      </span>
                    </div>
                    <span style={{ fontSize: 11, color: "var(--color-text-muted)", textAlign: "right" }}>
                      raw: {b.raw_value}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--color-text-muted)", textAlign: "right" }}>
                      norm: {b.normalized_value.toFixed(3)}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-accent)", textAlign: "right" }}>
                      +{(b.weighted_score * 100).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export function EvaluationClient() {
  const { getToken } = useAuth();
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [applicantType, setApplicantType] = useState<"external" | "internal" | "both">("both");

  const handleExport = async (format: "pdf" | "excel") => {
    if (!result) return;
    setExporting(true);
    try {
      if (format === "pdf") await exportEvaluationPDF(result);
      else await exportEvaluationExcel(result);
    } finally {
      setExporting(false);
    }
  };

  const handleRun = async (saveScores: boolean) => {
    setRunning(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated.");
      const res = await evaluationApi.run(token, { save_scores: saveScores, applicant_type: applicantType });
      setResult(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Evaluation failed.");
    } finally {
      setRunning(false);
    }
  };

  return (
    <>
      {/* ── Algorithm info card ──────────────────────────── */}
      <div
        className="glass"
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 16,
          padding: "1.25rem 1.5rem",
          borderRadius: "var(--radius-lg)",
          marginBottom: "1.5rem",
          border: "1px solid var(--color-accent-subtle)",
        }}
      >
        <div style={{ flex: 1 }}>
          <h3 style={{ color: "var(--color-text-primary)", marginBottom: 4, fontSize: 14 }}>
            Weighted Sum Model (WSM)
          </h3>
          <p style={{ fontSize: 12, color: "var(--color-text-muted)", lineHeight: 1.6 }}>
            Scores are computed in three steps: <strong style={{ color: "var(--color-text-secondary)" }}>① Collect</strong> raw applicant values per criterion,{" "}
            <strong style={{ color: "var(--color-text-secondary)" }}>② Normalize</strong> using min-max scaling (0→1), then{" "}
            <strong style={{ color: "var(--color-text-secondary)" }}>③ Weight</strong> by each criterion&apos;s configured percentage and sum.
            Final score is on a 0–100 scale.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexShrink: 0, flexWrap: "wrap", alignItems: "center" }}>
          <select
            className="input"
            style={{ width: 150, padding: "0.55rem 0.8rem", fontSize: 13 }}
            value={applicantType}
            onChange={(e) => setApplicantType(e.target.value as "external" | "internal" | "both")}
            disabled={running}
          >
            <option value="both">All Applicants</option>
            <option value="external">External Only</option>
            <option value="internal">Internal Staff Only</option>
          </select>
          <button
            id="eval-run-preview-btn"
            className="btn btn-ghost"
            disabled={running}
            onClick={() => handleRun(false)}
          >
            Preview (no save)
          </button>
          <button
            id="eval-run-save-btn"
            className="btn btn-primary"
            disabled={running}
            onClick={() => handleRun(true)}
            style={{ padding: "0.6rem 1.4rem" }}
          >
            <Play size={14} />
            {running ? "Running…" : "Run & Save Scores"}
          </button>
        </div>
      </div>

      {/* ── Error ────────────────────────────────────────── */}
      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 16px",
            background: "hsla(0,72%,60%,0.12)",
            border: "1px solid hsla(0,72%,60%,0.3)",
            borderRadius: "var(--radius-md)",
            color: "var(--color-danger)",
            fontSize: 13,
            marginBottom: "1rem",
          }}
        >
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* ── Results ──────────────────────────────────────── */}
      {result && (
        <>
          {/* Summary row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: "1rem",
              marginBottom: "1.5rem",
            }}
          >
            {[
              { label: "Applicants Evaluated", value: result.total_applicants, color: "var(--color-accent)" },
              { label: "Active Criteria", value: result.criteria_count, color: "var(--color-info)" },
              { label: "Total Weight", value: `${result.total_weight.toFixed(1)}%`, color: "var(--color-success)" },
              { label: "Scores Saved to DB", value: result.scores_saved ? "Yes ✓" : "No (preview)", color: result.scores_saved ? "var(--color-success)" : "var(--color-warning)" },
            ].map((k) => (
              <div key={k.label} className="card" style={{ padding: "1.1rem" }}>
                <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginBottom: 6, fontWeight: 500 }}>{k.label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: k.color }}>{k.value}</div>
              </div>
            ))}
          </div>

          {/* Status banner */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 14px",
              background: "hsla(150,60%,50%,0.08)",
              border: "1px solid hsla(150,60%,50%,0.2)",
              borderRadius: "var(--radius-md)",
              fontSize: 13,
              color: "var(--color-success)",
              marginBottom: "1rem",
            }}
          >
            <CheckCircle size={14} />
            Evaluation complete — {result.total_applicants} applicants ranked. Click any row to see per-criterion breakdown.
          </div>

          {/* ── DSS Recommendation ──────────────────────────── */}
          <div
            style={{
              padding: "1rem 1.25rem",
              background: "hsla(243, 80%, 60%, 0.07)",
              border: "1px solid hsla(243, 80%, 60%, 0.2)",
              borderRadius: "var(--radius-md)",
              marginBottom: "1rem",
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
            }}
          >
            <Lightbulb size={16} color="var(--color-accent)" style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: "var(--color-accent)", marginBottom: 4 }}>
                DSS Recommendation
              </p>
              <p style={{ fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
                Based on the Weighted Sum Model,{" "}
                <strong style={{ color: "var(--color-text-primary)" }}>
                  {result.rankings[0]?.first_name} {result.rankings[0]?.last_name}
                </strong>{" "}
                is the top-ranked candidate with a score of{" "}
                <strong style={{ color: "var(--color-accent)" }}>
                  {result.rankings[0]?.mcdm_score.toFixed(2)}/100
                </strong>.
                {result.rankings.length > 1 && (
                  <>
                    {" "}The top 3 candidates account for{" "}
                    {((
                      result.rankings.slice(0, 3).reduce((s, r) => s + r.mcdm_score, 0) /
                      result.rankings.reduce((s, r) => s + r.mcdm_score, 0)
                    ) * 100).toFixed(0)}% of total scoring weight.
                  </>
                )}
                {" "}This ranking is advisory — final selection remains with the hiring committee.
              </p>
            </div>
          </div>

          {/* ── Export Controls ──────────────────────────────── */}
          <div style={{ display: "flex", gap: 8, marginBottom: "1rem", flexWrap: "wrap" }}>
            <button
              id="eval-export-pdf-btn"
              className="btn btn-ghost"
              style={{ fontSize: 12, padding: "6px 12px" }}
              disabled={exporting}
              onClick={() => handleExport("pdf")}
            >
              <FileDown size={13} />
              {exporting ? "Exporting…" : "Export PDF"}
            </button>
            <button
              id="eval-export-excel-btn"
              className="btn btn-ghost"
              style={{ fontSize: 12, padding: "6px 12px" }}
              disabled={exporting}
              onClick={() => handleExport("excel")}
            >
              <FileSpreadsheet size={13} />
              Export Excel
            </button>
          </div>

          {/* Rankings table */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
                  {["Rank", "Applicant", "Status", "MCDM Score (0–100)", ""].map((h) => (
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
                {result.rankings.map((r) => (
                  <BreakdownRow key={r.applicant_id} ranking={r} />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!result && !running && !error && (
        <div className="card" style={{ padding: "4rem", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎯</div>
          <h3 style={{ color: "var(--color-text-primary)", marginBottom: 8 }}>Ready to Evaluate</h3>
          <p style={{ color: "var(--color-text-muted)", fontSize: 13, marginBottom: 20, maxWidth: 400, margin: "0 auto 20px" }}>
            Make sure you have applicants (pending or shortlisted) and active evaluation criteria configured before running.
          </p>
          <button id="eval-start-btn" className="btn btn-primary" onClick={() => handleRun(true)}>
            <Play size={14} /> Run Evaluation
          </button>
        </div>
      )}
    </>
  );
}
