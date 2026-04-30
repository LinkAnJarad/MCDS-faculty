"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { X } from "lucide-react";
import { criteriaApi, type Criteria, type CriteriaCreate } from "@/lib/api";

interface Props {
  existing: Criteria | null;
  onClose: () => void;
  onSaved: () => void;
}

const DATA_KEY_OPTIONS = [
  { value: "years_experience", label: "Years of Experience" },
  { value: "research_outputs", label: "Research Outputs (count)" },
  { value: "certifications", label: "Certifications (count)" },
  { value: "highest_degree", label: "Highest Degree (ordinal)" },
  { value: "teaching_units_available", label: "Teaching Units Available" },
];

export function CriteriaModal({ existing, onClose, onSaved }: Props) {
  const { getToken } = useAuth();
  const isEdit = !!existing;

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<CriteriaCreate>({
    name: existing?.name ?? "",
    description: existing?.description ?? "",
    weight: existing?.weight ?? 0,
    data_key: existing?.data_key ?? "years_experience",
    is_active: existing?.is_active ?? true,
  });

  const set = <K extends keyof CriteriaCreate>(k: K, v: CriteriaCreate[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated.");
      const payload = { ...form, description: form.description || undefined };
      if (isEdit && existing) {
        await criteriaApi.update(token, existing.id, payload);
      } else {
        await criteriaApi.create(token, payload);
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
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: 440,
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
              {isEdit ? "Edit Criteria" : "Add Criteria"}
            </h3>
            <p style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
              Weights of all active criteria must total 100%.
            </p>
          </div>
          <button id="criteria-modal-close" onClick={onClose} className="btn btn-ghost" style={{ padding: 6 }}>
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form
          id="criteria-form"
          onSubmit={handleSubmit}
          style={{ flex: 1, overflowY: "auto", padding: 24 }}
        >
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="cf-name" style={labelStyle}>Criteria Name *</label>
            <input
              id="cf-name"
              className="input"
              required
              placeholder="e.g. Years of Experience"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label htmlFor="cf-data-key" style={labelStyle}>Evaluates (Applicant Field) *</label>
            <select
              id="cf-data-key"
              className="input"
              value={form.data_key}
              onChange={(e) => set("data_key", e.target.value)}
            >
              {DATA_KEY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <p style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 4 }}>
              This maps to the applicant attribute used during MCDM scoring.
            </p>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label htmlFor="cf-weight" style={labelStyle}>
              Weight (%) * — current: {form.weight}%
            </label>
            <input
              id="cf-weight"
              type="number"
              min={0}
              max={100}
              step={0.5}
              className="input"
              required
              value={form.weight}
              onChange={(e) => set("weight", Number(e.target.value))}
            />
            {/* Visual mini bar */}
            <div style={{ marginTop: 8, height: 4, background: "var(--color-bg-elevated)", borderRadius: 999, overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${Math.min(form.weight, 100)}%`,
                  background: "var(--gradient-brand)",
                  borderRadius: 999,
                  transition: "width 0.2s ease",
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label htmlFor="cf-desc" style={labelStyle}>Description</label>
            <textarea
              id="cf-desc"
              className="input"
              rows={3}
              placeholder="Optional: explain how this criteria is applied…"
              value={form.description ?? ""}
              onChange={(e) => set("description", e.target.value)}
              style={{ resize: "vertical" }}
            />
          </div>

          {/* Active toggle */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 14px",
              background: "var(--color-bg-elevated)",
              borderRadius: "var(--radius-sm)",
              marginBottom: 20,
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" }}>Active</div>
              <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                Inactive criteria are excluded from weight totals and MCDM scoring.
              </div>
            </div>
            <button
              type="button"
              id="cf-active-toggle"
              onClick={() => set("is_active", !form.is_active)}
              style={{
                width: 44,
                height: 24,
                borderRadius: 999,
                border: "none",
                background: form.is_active ? "var(--color-accent)" : "var(--color-bg-muted)",
                position: "relative",
                cursor: "pointer",
                transition: "background var(--transition-fast)",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 4,
                  left: form.is_active ? 23 : 4,
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: "#fff",
                  transition: "left var(--transition-fast)",
                }}
              />
            </button>
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
          <button type="button" className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>
            Cancel
          </button>
          <button
            type="submit"
            form="criteria-form"
            className="btn btn-primary"
            disabled={saving}
            style={{ flex: 2 }}
          >
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Criteria"}
          </button>
        </div>
      </div>
    </>
  );
}
