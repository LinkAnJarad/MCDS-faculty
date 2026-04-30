"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  Zap,
  Sliders,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  X,
  FileDown,
  FileSpreadsheet,
  Lightbulb,
} from "lucide-react";
import {
  optimizationApi,
  type OptimizationResult,
  type AllocationItem,
} from "@/lib/api";
import { exportOptimizationPDF, exportOptimizationExcel } from "@/lib/export";

const DATA_KEYS = [
  { key: "years_experience", label: "Years of Experience" },
  { key: "research_outputs", label: "Research Outputs" },
  { key: "certifications", label: "Certifications" },
  { key: "highest_degree", label: "Highest Degree" },
  { key: "teaching_units_available", label: "Teaching Units" },
];

function AllocationCard({ item, index }: { item: AllocationItem; index: number }) {
  return (
    <div
      className="card animate-fadein"
      style={{
        animationDelay: `${index * 50}ms`,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      {/* Applicant → Position */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div
          style={{
            flex: 1,
            padding: "8px 12px",
            background: "var(--color-accent-subtle)",
            borderRadius: "var(--radius-sm)",
            border: "1px solid hsla(243,50%,50%,0.2)",
          }}
        >
          <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginBottom: 2 }}>ASSIGNED APPLICANT</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}>
            {item.applicant_name}
          </div>
        </div>
        <ArrowRight size={16} color="var(--color-accent)" style={{ flexShrink: 0 }} />
        <div
          style={{
            flex: 1,
            padding: "8px 12px",
            background: "var(--color-bg-elevated)",
            borderRadius: "var(--radius-sm)",
          }}
        >
          <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginBottom: 2 }}>
            {item.department_name ?? "Position"}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}>
            {item.position_title}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 12, fontSize: 12, color: "var(--color-text-muted)" }}>
        <div>
          <span style={{ color: "var(--color-accent)", fontWeight: 700 }}>
            {item.alignment_score.toFixed(2)}
          </span>
          {" "}MCDM score
        </div>
        <div>•</div>
        <div>{item.teaching_units} teaching units</div>
      </div>

      {/* Score bar */}
      <div style={{ height: 4, background: "var(--color-bg-base)", borderRadius: 999, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${Math.min(item.alignment_score, 100)}%`,
            background: "var(--gradient-brand)",
            borderRadius: 999,
            boxShadow: "var(--shadow-accent)",
          }}
        />
      </div>
    </div>
  );
}

export function OptimizationClient() {
  const { getToken } = useAuth();

  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [whatIfOpen, setWhatIfOpen] = useState(false);
  const [maximizeCoverage, setMaximizeCoverage] = useState(false);
  const [saveAllocations, setSaveAllocations] = useState(true);
  const [exporting, setExporting] = useState(false);

  const handleExport = async (format: "pdf" | "excel") => {
    if (!result) return;
    setExporting(true);
    try {
      if (format === "pdf") await exportOptimizationPDF(result);
      else await exportOptimizationExcel(result);
    } finally {
      setExporting(false);
    }
  };

  // What-if custom weights
  const [customWeights, setCustomWeights] = useState<Record<string, number>>({});
  const [useCustomWeights, setUseCustomWeights] = useState(false);
  const totalCustomWeight = Object.values(customWeights).reduce((s, v) => s + v, 0);
  const customWeightsValid = !useCustomWeights || Math.abs(totalCustomWeight - 100) < 0.1;

  const handleRun = async (simulate: boolean) => {
    if (!customWeightsValid) {
      setError(`Custom weights must sum to 100% (current: ${totalCustomWeight.toFixed(1)}%)`);
      return;
    }
    setRunning(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated.");
      const req = {
        save_allocations: !simulate && saveAllocations,
        maximize_coverage: maximizeCoverage,
        custom_weights: useCustomWeights && Object.keys(customWeights).length > 0 ? customWeights : undefined,
      };
      const res = simulate
        ? await optimizationApi.simulate(token, req)
        : await optimizationApi.run(token, req);
      setResult(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Optimization failed.");
    } finally {
      setRunning(false);
    }
  };

  const statusColor =
    result?.status === "Optimal"
      ? "var(--color-success)"
      : result?.status === "Infeasible"
      ? "var(--color-danger)"
      : "var(--color-warning)";

  return (
    <>
      {/* ── Control Panel ──────────────────────────────────── */}
      <div className="card" style={{ marginBottom: "1.5rem", padding: "1.25rem 1.5rem" }}>
        <h3 style={{ color: "var(--color-text-primary)", marginBottom: 4, fontSize: 14 }}>
          LP Assignment Engine — PuLP / CBC
        </h3>
        <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 16, lineHeight: 1.6 }}>
          Assigns applicants to open positions by solving a{" "}
          <strong style={{ color: "var(--color-text-secondary)" }}>Binary Integer Program</strong> that maximises total MCDM alignment score,
          subject to: one applicant per position, PhD requirements, and teaching unit availability.
        </p>

        {/* Options row */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 20, marginBottom: 16, alignItems: "center" }}>
          <label
            style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13 }}
            id="opt-maximize-coverage-label"
          >
            <input
              type="checkbox"
              id="opt-maximize-coverage"
              checked={maximizeCoverage}
              onChange={(e) => setMaximizeCoverage(e.target.checked)}
              style={{ accentColor: "var(--color-accent)" }}
            />
            <span style={{ color: "var(--color-text-secondary)" }}>
              Maximize coverage (fill most positions) instead of score
            </span>
          </label>

          <label
            style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13 }}
            id="opt-save-label"
          >
            <input
              type="checkbox"
              id="opt-save-allocations"
              checked={saveAllocations}
              onChange={(e) => setSaveAllocations(e.target.checked)}
              style={{ accentColor: "var(--color-accent)" }}
            />
            <span style={{ color: "var(--color-text-secondary)" }}>Save allocations to database</span>
          </label>
        </div>

        {/* What-if toggle */}
        <button
          id="opt-whatif-toggle"
          className="btn btn-ghost"
          style={{ marginBottom: whatIfOpen ? 16 : 0, fontSize: 12, padding: "6px 12px" }}
          onClick={() => setWhatIfOpen((o) => !o)}
        >
          <Sliders size={13} /> What-If Scenario Weights
          {whatIfOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>

        {/* What-if panel */}
        {whatIfOpen && (
          <div
            style={{
              padding: "16px",
              background: "var(--color-bg-elevated)",
              borderRadius: "var(--radius-md)",
              marginBottom: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 2 }}>
                  Custom Criteria Weights (must sum to 100%)
                </p>
                <p style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                  Override stored weights for this scenario. Does not modify saved criteria.
                </p>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  id="opt-use-custom-weights"
                  checked={useCustomWeights}
                  onChange={(e) => setUseCustomWeights(e.target.checked)}
                  style={{ accentColor: "var(--color-accent)" }}
                />
                Enable
              </label>
            </div>

            {useCustomWeights && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 10 }}>
                  {DATA_KEYS.map((dk) => (
                    <div key={dk.key}>
                      <label
                        style={{
                          display: "block",
                          fontSize: 10,
                          fontWeight: 600,
                          color: "var(--color-text-muted)",
                          letterSpacing: "0.05em",
                          textTransform: "uppercase",
                          marginBottom: 4,
                        }}
                      >
                        {dk.label} (%)
                      </label>
                      <input
                        id={`opt-weight-${dk.key}`}
                        type="number"
                        min={0}
                        max={100}
                        step={1}
                        className="input"
                        style={{ fontSize: 13 }}
                        value={customWeights[dk.key] ?? ""}
                        onChange={(e) =>
                          setCustomWeights((prev) => ({
                            ...prev,
                            [dk.key]: Number(e.target.value),
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>

                {/* Weight sum bar */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
                  <div style={{ flex: 1, height: 4, background: "var(--color-bg-base)", borderRadius: 999, overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${Math.min(totalCustomWeight, 100)}%`,
                        background: customWeightsValid ? "var(--color-success)" : "var(--color-danger)",
                        borderRadius: 999,
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: customWeightsValid ? "var(--color-success)" : "var(--color-danger)",
                    }}
                  >
                    {totalCustomWeight.toFixed(1)}%
                  </span>
                  {!useCustomWeights || Object.keys(customWeights).length === 0 ? null : (
                    <button
                      id="opt-clear-weights"
                      className="btn btn-ghost"
                      style={{ padding: "2px 8px", fontSize: 11 }}
                      onClick={() => setCustomWeights({})}
                    >
                      <X size={11} /> Clear
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 14px",
              background: "hsla(0,72%,60%,0.12)",
              border: "1px solid hsla(0,72%,60%,0.3)",
              borderRadius: "var(--radius-sm)",
              color: "var(--color-danger)",
              fontSize: 13,
              marginBottom: 12,
            }}
          >
            <AlertTriangle size={14} />
            {error}
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            id="opt-simulate-btn"
            className="btn btn-ghost"
            disabled={running}
            onClick={() => handleRun(true)}
          >
            <Sliders size={14} /> Simulate (no save)
          </button>
          <button
            id="opt-run-btn"
            className="btn btn-primary"
            disabled={running || !customWeightsValid}
            onClick={() => handleRun(false)}
            style={{ padding: "0.6rem 1.4rem" }}
          >
            <Zap size={14} />
            {running ? "Solving…" : "Run Optimization"}
          </button>
        </div>
      </div>

      {/* ── Results ──────────────────────────────────────────── */}
      {result && (
        <>
          {/* Status banner */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 16px",
              background: `${statusColor}10`,
              border: `1px solid ${statusColor}40`,
              borderRadius: "var(--radius-md)",
              marginBottom: "1.5rem",
            }}
          >
            {result.status === "Optimal" ? (
              <CheckCircle size={16} color={statusColor} />
            ) : (
              <AlertTriangle size={16} color={statusColor} />
            )}
            <div style={{ flex: 1 }}>
              <span style={{ fontWeight: 700, color: statusColor }}>{result.status}</span>
              {" — "}
              <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{result.solver_message}</span>
            </div>
            <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
              {result.scores_saved ? "✓ Saved to DB" : "Preview only"}
            </div>
          </div>

          {/* KPI stripe */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: "1rem",
              marginBottom: "1.5rem",
            }}
          >
            {[
              { label: "Allocations Made", value: result.allocation_count, color: "var(--color-success)" },
              { label: "Total Score", value: result.total_score.toFixed(2), color: "var(--color-accent)" },
              { label: "Unallocated Applicants", value: result.unallocated_applicant_names.length, color: "var(--color-warning)" },
              { label: "Unfilled Positions", value: result.unfilled_position_titles.length, color: "var(--color-danger)" },
            ].map((k) => (
              <div key={k.label} className="card" style={{ padding: "1.1rem" }}>
                <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginBottom: 6, fontWeight: 500 }}>{k.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: k.color }}>{k.value}</div>
              </div>
            ))}
          </div>

          {/* ── DSS Recommendation ──────────────────────────── */}
          {result.status === "Optimal" && result.allocations.length > 0 && (
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
                  The LP solver produced an <strong style={{ color: "var(--color-success)" }}>Optimal</strong>{" "}
                  solution assigning <strong style={{ color: "var(--color-text-primary)" }}>{result.allocation_count}</strong> applicant(s)
                  to open positions, maximising total alignment score of{" "}
                  <strong style={{ color: "var(--color-accent)" }}>{result.total_score.toFixed(2)}</strong>.
                  {result.unallocated_applicant_names.length > 0 && (
                    <> {result.unallocated_applicant_names.length} applicant(s) remain unallocated due to hard constraints (PhD requirement or insufficient teaching units).</>
                  )}
                  {" "}These assignments are advisory — final approval rests with the hiring committee.
                </p>
              </div>
            </div>
          )}

          {/* ── Export Controls ──────────────────────────────── */}
          <div style={{ display: "flex", gap: 8, marginBottom: "1rem", flexWrap: "wrap" }}>
            <button
              id="opt-export-pdf-btn"
              className="btn btn-ghost"
              style={{ fontSize: 12, padding: "6px 12px" }}
              disabled={exporting}
              onClick={() => handleExport("pdf")}
            >
              <FileDown size={13} />
              {exporting ? "Exporting…" : "Export PDF"}
            </button>
            <button
              id="opt-export-excel-btn"
              className="btn btn-ghost"
              style={{ fontSize: 12, padding: "6px 12px" }}
              disabled={exporting}
              onClick={() => handleExport("excel")}
            >
              <FileSpreadsheet size={13} />
              Export Excel
            </button>
          </div>

          {/* Allocations grid */}
          {result.allocations.length > 0 && (
            <>
              <h4 style={{ color: "var(--color-text-secondary)", marginBottom: "0.75rem", fontSize: 12, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                Assignments ({result.allocation_count})
              </h4>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                  gap: "0.75rem",
                  marginBottom: "1.5rem",
                }}
              >
                {result.allocations.map((al, i) => (
                  <AllocationCard key={al.applicant_id} item={al} index={i} />
                ))}
              </div>
            </>
          )}

          {/* Unallocated / Unfilled */}
          {(result.unallocated_applicant_names.length > 0 || result.unfilled_position_titles.length > 0) && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
              }}
            >
              {result.unallocated_applicant_names.length > 0 && (
                <div className="card" style={{ padding: "1rem" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-warning)", marginBottom: 8, letterSpacing: "0.05em" }}>
                    ⚠ Unallocated Applicants
                  </div>
                  {result.unallocated_applicant_names.map((n) => (
                    <div
                      key={n}
                      style={{
                        padding: "4px 0",
                        fontSize: 13,
                        color: "var(--color-text-secondary)",
                        borderBottom: "1px solid var(--color-border-subtle)",
                      }}
                    >
                      {n}
                    </div>
                  ))}
                </div>
              )}
              {result.unfilled_position_titles.length > 0 && (
                <div className="card" style={{ padding: "1rem" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-danger)", marginBottom: 8, letterSpacing: "0.05em" }}>
                    ✗ Unfilled Positions
                  </div>
                  {result.unfilled_position_titles.map((t) => (
                    <div
                      key={t}
                      style={{
                        padding: "4px 0",
                        fontSize: 13,
                        color: "var(--color-text-secondary)",
                        borderBottom: "1px solid var(--color-border-subtle)",
                      }}
                    >
                      {t}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Empty state */}
      {!result && !running && !error && (
        <div className="card" style={{ padding: "4rem", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚡</div>
          <h3 style={{ color: "var(--color-text-primary)", marginBottom: 8 }}>Ready to Optimize</h3>
          <p style={{ color: "var(--color-text-muted)", fontSize: 13, marginBottom: 20, maxWidth: 500, margin: "0 auto 20px" }}>
            Prerequisites: run the MCDM evaluation first (saves scores), then add at least one open position with a department.
            The CBC solver will compute the globally-optimal assignment in milliseconds.
          </p>
          <button id="opt-start-btn" className="btn btn-primary" onClick={() => handleRun(false)}>
            <Zap size={14} /> Run Optimization
          </button>
        </div>
      )}
    </>
  );
}
