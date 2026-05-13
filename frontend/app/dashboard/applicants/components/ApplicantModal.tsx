"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { X } from "lucide-react";
import {
  applicantsApi,
  positionsApi,
  type Applicant,
  type ApplicantCreate,
  type Position,
  type HighestDegree,
  type ApplicantStatus,
} from "@/lib/api";

interface Props {
  existing: Applicant | null;
  onClose: () => void;
  onSaved: () => void;
}

const DEGREES: { value: HighestDegree; label: string }[] = [
  { value: "bachelors", label: "Bachelor's Degree" },
  { value: "masters", label: "Master's Degree" },
  { value: "doctorate", label: "Doctorate (PhD)" },
  { value: "post_doctorate", label: "Post-Doctorate" },
];

const STATUSES: { value: ApplicantStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "rejected", label: "Rejected" },
  { value: "hired", label: "Hired" },
];

export function ApplicantModal({ existing, onClose, onSaved }: Props) {
  const { getToken } = useAuth();
  const isEdit = !!existing;

  const [positions, setPositions] = useState<Position[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<ApplicantCreate & { _years: number; _research: number; _certs: number }>({
    first_name: existing?.first_name ?? "",
    last_name: existing?.last_name ?? "",
    email: existing?.email ?? "",
    highest_degree: existing?.highest_degree ?? "bachelors",
    _years: existing?.dynamic_data?.years_experience ?? 0,
    _research: existing?.dynamic_data?.research_outputs ?? 0,
    _certs: existing?.dynamic_data?.certifications ?? 0,
    specialization: existing?.specialization ?? "",
    teaching_units_available: existing?.teaching_units_available ?? 18,
    applied_position_id: existing?.applied_position_id ?? null,
    status: existing?.status ?? "pending",
    is_internal: existing?.is_internal ?? false,
  });

  const set = <K extends keyof ApplicantCreate>(k: K, v: ApplicantCreate[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const loadPositions = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    try {
      setPositions(await positionsApi.list(token));
    } catch {
      // positions are optional — silently ignore
    }
  }, [getToken]);

  useEffect(() => { loadPositions(); }, [loadPositions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated.");
      const payload = {
        ...form,
        specialization: form.specialization || undefined,
        applied_position_id: form.applied_position_id || null,
        dynamic_data: {
          years_experience: form._years,
          research_outputs: form._research,
          certifications: form._certs,
        }
      };
      // remove transient fields
      delete (payload as any)._years;
      delete (payload as any)._research;
      delete (payload as any)._certs;
      if (isEdit && existing) {
        await applicantsApi.update(token, existing.id, payload);
      } else {
        await applicantsApi.create(token, payload);
      }
      onSaved();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 11,
    fontWeight: 600,
    color: "var(--color-text-muted)",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    marginBottom: 5,
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "hsla(222,47%,4%,0.7)",
          backdropFilter: "blur(4px)",
          zIndex: 200,
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: 480,
          background: "var(--color-bg-surface)",
          borderLeft: "1px solid var(--color-border)",
          zIndex: 201,
          display: "flex",
          flexDirection: "column",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px",
            borderBottom: "1px solid var(--color-border-subtle)",
          }}
        >
          <div>
            <h3 style={{ color: "var(--color-text-primary)", marginBottom: 2 }}>
              {isEdit ? "Edit Applicant" : "Add Applicant"}
            </h3>
            <p style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
              {isEdit ? "Update this applicant's profile." : "Fill in the applicant's details."}
            </p>
          </div>
          <button
            id="applicant-modal-close"
            onClick={onClose}
            className="btn btn-ghost"
            style={{ padding: "6px", borderRadius: "var(--radius-sm)" }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form
          id="applicant-form"
          onSubmit={handleSubmit}
          style={{ flex: 1, overflowY: "auto", padding: "24px" }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <label htmlFor="af-first-name" style={labelStyle}>First Name *</label>
              <input
                id="af-first-name"
                className="input"
                required
                value={form.first_name}
                onChange={(e) => set("first_name", e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="af-last-name" style={labelStyle}>Last Name *</label>
              <input
                id="af-last-name"
                className="input"
                required
                value={form.last_name}
                onChange={(e) => set("last_name", e.target.value)}
              />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label htmlFor="af-email" style={labelStyle}>Email *</label>
            <input
              id="af-email"
              type="email"
              className="input"
              required
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label htmlFor="af-degree" style={labelStyle}>Highest Degree *</label>
            <select
              id="af-degree"
              className="input"
              value={form.highest_degree}
              onChange={(e) => set("highest_degree", e.target.value as HighestDegree)}
            >
              {DEGREES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <label htmlFor="af-exp" style={labelStyle}>Years Exp. *</label>
              <input
                id="af-exp"
                type="number"
                min={0}
                className="input"
                required
                value={form._years}
                onChange={(e) => set("_years", Number(e.target.value)) as any}
              />
            </div>
            <div>
              <label htmlFor="af-research" style={labelStyle}>Research Outputs</label>
              <input
                id="af-research"
                type="number"
                min={0}
                className="input"
                value={form._research}
                onChange={(e) => set("_research", Number(e.target.value)) as any}
              />
            </div>
            <div>
              <label htmlFor="af-certs" style={labelStyle}>Certifications</label>
              <input
                id="af-certs"
                type="number"
                min={0}
                className="input"
                value={form._certs}
                onChange={(e) => set("_certs", Number(e.target.value)) as any}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <label htmlFor="af-units" style={labelStyle}>Teaching Units Available</label>
              <input
                id="af-units"
                type="number"
                min={0}
                max={30}
                className="input"
                value={form.teaching_units_available}
                onChange={(e) => set("teaching_units_available", Number(e.target.value))}
              />
            </div>
            <div>
              <label htmlFor="af-status" style={labelStyle}>Status</label>
              <select
                id="af-status"
                className="input"
                value={form.status}
                onChange={(e) => set("status", e.target.value as ApplicantStatus)}
              >
                {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label htmlFor="af-specialization" style={labelStyle}>Specialization</label>
            <input
              id="af-specialization"
              className="input"
              placeholder="e.g. Applied Mathematics, Software Engineering…"
              value={form.specialization ?? ""}
              onChange={(e) => set("specialization", e.target.value)}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label htmlFor="af-position" style={labelStyle}>Applied Position</label>
            <select
              id="af-position"
              className="input"
              value={form.applied_position_id ?? ""}
              onChange={(e) => set("applied_position_id", e.target.value || null)}
            >
              <option value="">— None —</option>
              {positions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} {p.department ? `(${p.department.name})` : ""} {!p.is_open ? "(Closed)" : ""}
                </option>
              ))}
            </select>
          </div>


          {error && (
            <div
              style={{
                padding: "10px 14px",
                background: "hsla(0,72%,60%,0.12)",
                border: "1px solid hsla(0,72%,60%,0.3)",
                borderRadius: "var(--radius-sm)",
                color: "var(--color-danger)",
                fontSize: 13,
                marginBottom: 16,
              }}
            >
              {error}
            </div>
          )}
        </form>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            gap: 10,
            padding: "16px 24px",
            borderTop: "1px solid var(--color-border-subtle)",
          }}
        >
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
            style={{ flex: 1 }}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="applicant-form"
            className="btn btn-primary"
            disabled={saving}
            style={{ flex: 2 }}
          >
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Applicant"}
          </button>
        </div>
      </div>
    </>
  );
}
