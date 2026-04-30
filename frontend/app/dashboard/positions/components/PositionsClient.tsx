"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  Plus, Pencil, Trash2, Building2, Briefcase,
  CheckCircle2, XCircle, X, AlertCircle, RefreshCw,
} from "lucide-react";
import {
  departmentsApi, positionsApi,
  type Department, type Position,
  type DepartmentCreate, type PositionCreate,
} from "@/lib/api";

// ─────────────────────────────────────────────────────────────────────────────
// Department inline form
// ─────────────────────────────────────────────────────────────────────────────

interface DeptFormState { name: string; code: string; description: string }

const EMPTY_DEPT: DeptFormState = { name: "", code: "", description: "" };

function DeptForm({
  initial, onSave, onCancel,
}: {
  initial?: DeptFormState;
  onSave: (d: DeptFormState) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<DeptFormState>(initial ?? EMPTY_DEPT);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof DeptFormState, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(null);
    try { await onSave(form); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : "Save failed."); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
      <div style={{ flex: "2 1 140px" }}>
        <label style={labelStyle}>Department Name *</label>
        <input id="dept-name" className="input" required placeholder="e.g. Computer Science"
          value={form.name} onChange={e => set("name", e.target.value)} />
      </div>
      <div style={{ flex: "1 1 80px" }}>
        <label style={labelStyle}>Code *</label>
        <input id="dept-code" className="input" required placeholder="CS"
          style={{ textTransform: "uppercase" }}
          value={form.code} onChange={e => set("code", e.target.value.toUpperCase())} />
      </div>
      <div style={{ flex: "3 1 180px" }}>
        <label style={labelStyle}>Description</label>
        <input id="dept-desc" className="input" placeholder="Optional…"
          value={form.description} onChange={e => set("description", e.target.value)} />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit" id="dept-save-btn" className="btn btn-primary" disabled={saving}
          style={{ padding: "0.55rem 1.1rem" }}>
          {saving ? "Saving…" : (initial ? "Update" : "Add")}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onCancel}
          style={{ padding: "0.55rem 0.8rem" }}>
          <X size={14} />
        </button>
      </div>
      {error && <p style={{ width: "100%", fontSize: 12, color: "var(--color-danger)" }}>{error}</p>}
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Position modal (slide-over drawer)
// ─────────────────────────────────────────────────────────────────────────────

function PositionModal({
  existing, departments, onClose, onSaved,
}: {
  existing: Position | null;
  departments: Department[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { getToken } = useAuth();
  const isEdit = !!existing;

  const [form, setForm] = useState<PositionCreate>({
    title: existing?.title ?? "",
    department_id: existing?.department_id ?? (departments[0]?.id ?? ""),
    required_units: existing?.required_units ?? 18,
    requires_phd: existing?.requires_phd ?? false,
    description: existing?.description ?? "",
    is_open: existing?.is_open ?? true,
  });
  const set = <K extends keyof PositionCreate>(k: K, v: PositionCreate[K]) =>
    setForm(p => ({ ...p, [k]: v }));

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated.");
      const payload = { ...form, description: form.description || undefined };
      if (isEdit && existing) await positionsApi.update(token, existing.id, payload);
      else await positionsApi.create(token, payload);
      onSaved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally { setSaving(false); }
  };

  return (
    <>
      <div onClick={onClose} style={{
        position: "fixed", inset: 0, background: "hsla(222,47%,4%,0.7)",
        backdropFilter: "blur(4px)", zIndex: 200,
      }} />
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: 440,
        background: "var(--color-bg-surface)", borderLeft: "1px solid var(--color-border)",
        zIndex: 201, display: "flex", flexDirection: "column", boxShadow: "var(--shadow-lg)",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 24px", borderBottom: "1px solid var(--color-border-subtle)",
        }}>
          <div>
            <h3 style={{ color: "var(--color-text-primary)", marginBottom: 2 }}>
              {isEdit ? "Edit Position" : "Add Position"}
            </h3>
            <p style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
              {isEdit ? "Update this position's details." : "Create a new open position."}
            </p>
          </div>
          <button id="pos-modal-close" onClick={onClose} className="btn btn-ghost"
            style={{ padding: "6px", borderRadius: "var(--radius-sm)" }}>
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form id="position-form" onSubmit={handleSubmit}
          style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: 16 }}>

          <div>
            <label htmlFor="pos-title" style={labelStyle}>Position Title *</label>
            <input id="pos-title" className="input" required
              placeholder="e.g. Associate Professor in CS"
              value={form.title} onChange={e => set("title", e.target.value)} />
          </div>

          <div>
            <label htmlFor="pos-dept" style={labelStyle}>Department *</label>
            {departments.length === 0 ? (
              <p style={{ fontSize: 12, color: "var(--color-danger)", padding: "8px 0" }}>
                ⚠ No departments yet — add one in the Departments section first.
              </p>
            ) : (
              <select id="pos-dept" className="input" required
                value={form.department_id}
                onChange={e => set("department_id", e.target.value)}>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label htmlFor="pos-units" style={labelStyle}>Required Units</label>
              <input id="pos-units" type="number" min={1} max={30} className="input"
                value={form.required_units}
                onChange={e => set("required_units", Number(e.target.value))} />
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select id="pos-status" className="input"
                value={form.is_open ? "open" : "closed"}
                onChange={e => set("is_open", e.target.value === "open")}>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 4 }}>
            <input type="checkbox" id="pos-phd"
              checked={form.requires_phd}
              onChange={e => set("requires_phd", e.target.checked)}
              style={{ accentColor: "var(--color-accent)", width: 16, height: 16 }} />
            <label htmlFor="pos-phd" style={{ fontSize: 13, color: "var(--color-text-secondary)", cursor: "pointer" }}>
              Requires PhD (hard constraint for LP optimizer)
            </label>
          </div>

          <div>
            <label htmlFor="pos-desc" style={labelStyle}>Description</label>
            <textarea id="pos-desc" className="input" rows={3}
              placeholder="Optional notes about this position…"
              style={{ resize: "vertical" }}
              value={form.description ?? ""}
              onChange={e => set("description", e.target.value)} />
          </div>

          {error && (
            <div style={{
              display: "flex", alignItems: "center", gap: 8, padding: "10px 14px",
              background: "hsla(0,72%,60%,0.12)", border: "1px solid hsla(0,72%,60%,0.3)",
              borderRadius: "var(--radius-sm)", color: "var(--color-danger)", fontSize: 13,
            }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}
        </form>

        {/* Footer */}
        <div style={{ display: "flex", gap: 10, padding: "16px 24px", borderTop: "1px solid var(--color-border-subtle)" }}>
          <button type="button" className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
          <button type="submit" form="position-form" className="btn btn-primary"
            disabled={saving || departments.length === 0} style={{ flex: 2 }}>
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Position"}
          </button>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared style
// ─────────────────────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 11, fontWeight: 600,
  color: "var(--color-text-muted)", letterSpacing: "0.05em",
  textTransform: "uppercase", marginBottom: 5,
};

// ─────────────────────────────────────────────────────────────────────────────
// Main client component
// ─────────────────────────────────────────────────────────────────────────────

export function PositionsClient() {
  const { getToken } = useAuth();

  // ── state ──────────────────────────────────────────────────────────────────
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // dept UI
  const [showDeptForm, setShowDeptForm] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);

  // position UI
  const [posModal, setPosModal] = useState<"add" | Position | null>(null);

  // ── loaders ────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const token = await getToken();
      if (!token) return;
      const [depts, pos] = await Promise.all([
        departmentsApi.list(token),
        positionsApi.list(token),
      ]);
      setDepartments(depts);
      setPositions(pos);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load data.");
    } finally { setLoading(false); }
  }, [getToken]);

  useEffect(() => { load(); }, [load]);

  // ── department handlers ────────────────────────────────────────────────────
  const handleDeptSave = async (form: DeptFormState) => {
    const token = await getToken();
    if (!token) throw new Error("Not authenticated.");
    const payload: DepartmentCreate = {
      name: form.name, code: form.code,
      description: form.description || undefined,
    };
    if (editingDept) await departmentsApi.update(token, editingDept.id, payload);
    else await departmentsApi.create(token, payload);
    setShowDeptForm(false); setEditingDept(null);
    await load();
  };

  const handleDeptDelete = async (dept: Department) => {
    if (!confirm(`Delete department "${dept.name}"? All its positions must be deleted first.`)) return;
    try {
      const token = await getToken();
      if (!token) return;
      await departmentsApi.remove(token, dept.id);
      await load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Delete failed.");
    }
  };

  // ── position handlers ──────────────────────────────────────────────────────
  const handlePosDelete = async (pos: Position) => {
    if (!confirm(`Delete position "${pos.title}"?`)) return;
    try {
      const token = await getToken();
      if (!token) return;
      await positionsApi.remove(token, pos.id);
      await load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Delete failed.");
    }
  };

  // ── renders ────────────────────────────────────────────────────────────────
  const openPositions = positions.filter(p => p.is_open);
  const closedPositions = positions.filter(p => !p.is_open);

  return (
    <>
      {/* ── Departments section ─────────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: "1.5rem", padding: "1.25rem 1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Building2 size={16} color="var(--color-accent)" />
            <h3 style={{ fontSize: 14, color: "var(--color-text-primary)" }}>Departments</h3>
            <span className="badge badge-accent" style={{ fontSize: 10 }}>{departments.length}</span>
          </div>
          {!showDeptForm && !editingDept && (
            <button id="add-dept-btn" className="btn btn-ghost"
              onClick={() => setShowDeptForm(true)}
              style={{ fontSize: 12, padding: "5px 12px" }}>
              <Plus size={13} /> Add Department
            </button>
          )}
        </div>

        {/* Add form */}
        {showDeptForm && !editingDept && (
          <div style={{ marginBottom: 14, padding: "12px 14px", background: "var(--color-bg-elevated)", borderRadius: "var(--radius-md)" }}>
            <DeptForm onSave={handleDeptSave} onCancel={() => setShowDeptForm(false)} />
          </div>
        )}

        {/* Dept chips */}
        {departments.length === 0 && !showDeptForm ? (
          <p style={{ fontSize: 13, color: "var(--color-text-muted)", padding: "8px 0" }}>
            No departments yet. Add one to get started.
          </p>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {departments.map(dept => (
              <div key={dept.id}>
                {editingDept?.id === dept.id ? (
                  <div style={{ padding: "12px 14px", background: "var(--color-bg-elevated)", borderRadius: "var(--radius-md)", marginBottom: 8, minWidth: 400 }}>
                    <DeptForm
                      initial={{ name: dept.name, code: dept.code, description: dept.description ?? "" }}
                      onSave={handleDeptSave}
                      onCancel={() => setEditingDept(null)}
                    />
                  </div>
                ) : (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "6px 10px 6px 12px",
                    background: "var(--color-bg-elevated)",
                    border: "1px solid var(--color-border-subtle)",
                    borderRadius: "var(--radius-md)",
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-accent)" }}>{dept.code}</span>
                    <span style={{ fontSize: 13, color: "var(--color-text-primary)" }}>{dept.name}</span>
                    <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                      ({positions.filter(p => p.department_id === dept.id).length} pos)
                    </span>
                    <button className="btn btn-ghost" style={{ padding: "3px 6px" }}
                      onClick={() => { setEditingDept(dept); setShowDeptForm(false); }}>
                      <Pencil size={11} />
                    </button>
                    <button className="btn btn-ghost" style={{ padding: "3px 6px" }}
                      onClick={() => handleDeptDelete(dept)}>
                      <Trash2 size={11} color="var(--color-danger)" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Positions section ───────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Briefcase size={16} color="var(--color-accent)" />
          <h3 style={{ fontSize: 14, color: "var(--color-text-primary)" }}>Open Positions</h3>
          <span className="badge badge-accent" style={{ fontSize: 10 }}>{openPositions.length}</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button id="refresh-positions-btn" className="btn btn-ghost" onClick={load}
            style={{ fontSize: 12, padding: "5px 10px" }}>
            <RefreshCw size={12} className={loading ? "spin" : ""} />
          </button>
          <button id="add-position-btn" className="btn btn-primary" onClick={() => setPosModal("add")}
            style={{ fontSize: 13, padding: "0.55rem 1.1rem" }}>
            <Plus size={14} /> Add Position
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8, padding: "10px 14px",
          background: "hsla(0,72%,60%,0.12)", border: "1px solid hsla(0,72%,60%,0.3)",
          borderRadius: "var(--radius-md)", color: "var(--color-danger)", fontSize: 13, marginBottom: "1rem",
        }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {/* Positions table */}
      {loading ? (
        <div className="card" style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-muted)", fontSize: 13 }}>
          Loading…
        </div>
      ) : positions.length === 0 ? (
        <div className="card" style={{ padding: "4rem", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>💼</div>
          <h3 style={{ color: "var(--color-text-primary)", marginBottom: 8 }}>No positions yet</h3>
          <p style={{ color: "var(--color-text-muted)", fontSize: 13, marginBottom: 20, maxWidth: 360, margin: "0 auto 20px" }}>
            Add a department first, then create positions. Applicants will be able to select them when applying.
          </p>
          <button id="pos-empty-add-btn" className="btn btn-primary" onClick={() => setPosModal("add")}>
            <Plus size={14} /> Add First Position
          </button>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: "1.5rem" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
                {["Status", "Position Title", "Department", "Units", "PhD", ""].map(h => (
                  <th key={h} style={{
                    padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 600,
                    color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...openPositions, ...closedPositions].map(pos => (
                <tr key={pos.id}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--color-bg-hover)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  style={{ transition: "background var(--transition-fast)" }}>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {pos.is_open
                        ? <CheckCircle2 size={14} color="var(--color-success)" />
                        : <XCircle size={14} color="var(--color-text-muted)" />}
                      <span style={{
                        fontSize: 11, fontWeight: 600,
                        color: pos.is_open ? "var(--color-success)" : "var(--color-text-muted)",
                      }}>
                        {pos.is_open ? "Open" : "Closed"}
                      </span>
                    </span>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}>
                      {pos.title}
                    </div>
                    {pos.description && (
                      <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 2 }}>
                        {pos.description.slice(0, 60)}{pos.description.length > 60 ? "…" : ""}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <span className="badge" style={{
                      background: "var(--color-accent-subtle)",
                      color: "var(--color-accent)",
                    }}>
                      {pos.department?.code ?? "—"}
                    </span>
                    <span style={{ fontSize: 12, color: "var(--color-text-secondary)", marginLeft: 8 }}>
                      {pos.department?.name ?? ""}
                    </span>
                  </td>
                  <td style={{ padding: "12px 14px", fontSize: 13, color: "var(--color-text-secondary)" }}>
                    {pos.required_units} units
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600,
                      color: pos.requires_phd ? "var(--color-warning)" : "var(--color-text-muted)",
                    }}>
                      {pos.requires_phd ? "Required" : "—"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                      <button className="btn btn-ghost" style={{ padding: "5px 8px" }}
                        onClick={() => setPosModal(pos)}>
                        <Pencil size={13} />
                      </button>
                      <button className="btn btn-ghost" style={{ padding: "5px 8px" }}
                        onClick={() => handlePosDelete(pos)}>
                        <Trash2 size={13} color="var(--color-danger)" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Closed positions (collapsed count) */}
      {closedPositions.length > 0 && (
        <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 4 }}>
          + {closedPositions.length} closed position{closedPositions.length > 1 ? "s" : ""} (shown above in grey)
        </p>
      )}

      {/* Position modal */}
      {posModal !== null && (
        <PositionModal
          existing={posModal === "add" ? null : posModal}
          departments={departments}
          onClose={() => setPosModal(null)}
          onSaved={() => { setPosModal(null); load(); }}
        />
      )}
    </>
  );
}
