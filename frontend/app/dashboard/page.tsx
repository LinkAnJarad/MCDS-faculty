import type { Metadata } from "next";
import { auth, currentUser } from "@clerk/nextjs/server";
import { Header } from "@/components/layout/Header";
import {
  Users,
  SlidersHorizontal,
  BarChart3,
  Layers,
  ArrowRight,
  TrendingUp,
  CheckCircle,
  Clock,
} from "lucide-react";
import { DashboardStats } from "@/lib/api";
import { DashboardCharts } from "@/components/dashboard/Charts";

export const metadata: Metadata = {
  title: "Overview",
};

interface ModuleCard {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  badge: string;
  status: "ready" | "coming-soon";
  stat?: { label: string; value: string | number };
}

export default async function DashboardPage() {
  const user = await currentUser();
  const { getToken } = await auth();
  const token = await getToken();
  
  const firstName = user?.firstName ?? "there";
  const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";

  let stats: DashboardStats = {
    total_applicants: 0,
    shortlisted: 0,
    pending: 0,
    hired: 0,
    open_positions: 0,
    active_criteria: 0,
    evaluations_run: 0,
    total_allocations: 0,
    score_distribution: [],
    department_allocations: [],
  };

  if (token) {
    try {
      const res = await fetch(`${backendUrl}/api/v1/health/dashboard-stats`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        next: { revalidate: 10 } // cache for 10 seconds
      });
      if (res.ok) {
        stats = await res.json();
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    }
  }

  const MODULES: ModuleCard[] = [
    {
      id: "module-faculty-management",
      title: "Faculty Management",
      description:
        "Centralized profiles for applicants — educational credentials, research outputs, experience, and specialization.",
      href: "/dashboard/applicants",
      icon: Users,
      status: "ready",
      stat: { label: "Applicants", value: stats.total_applicants },
    },
    {
      id: "module-criteria-config",
      title: "Criteria Configuration",
      description:
        "Define and weight the evaluation criteria used to score applicants. Ensure weights total 100%.",
      href: "/dashboard/criteria",
      icon: SlidersHorizontal,
      status: "ready",
      stat: { label: "Active Criteria", value: stats.active_criteria },
    },
    {
      id: "module-evaluation",
      title: "MCDM Evaluation Engine",
      description:
        "Automated multi-criteria scoring and transparent applicant rankings using the Weighted Sum Model.",
      href: "/dashboard/evaluation",
      icon: BarChart3,
      status: "ready",
      stat: { label: "Evaluations Run", value: stats.evaluations_run },
    },
    {
      id: "module-optimization",
      title: "Optimization & Allocation",
      description:
        "Intelligently assign faculty to positions using linear programming — what-if scenario simulation included.",
      href: "/dashboard/optimization",
      icon: Layers,
      status: "ready",
      stat: { label: "Allocations", value: stats.total_allocations },
    },
    {
      id: "module-hired-faculty",
      title: "Hired Faculty",
      description:
        "View and manage applicants who have been successfully allocated and hired through the system.",
      href: "/dashboard/hired",
      icon: CheckCircle,
      status: "ready",
      stat: { label: "Hired", value: stats.hired },
    },
  ];

  const STAT_CARDS = [
    { id: "stat-total-applicants", label: "Total Applicants", value: stats.total_applicants, icon: Users, color: "var(--color-accent)" },
    { id: "stat-open-positions", label: "Open Positions", value: stats.open_positions, icon: TrendingUp, color: "var(--color-success)" },
    { id: "stat-shortlisted", label: "Shortlisted", value: stats.shortlisted, icon: CheckCircle, color: "var(--color-warning)" },
    { id: "stat-hired", label: "Hired Faculty", value: stats.hired, icon: CheckCircle, color: "var(--color-info)" },
  ];

  return (
    <>
      <Header
        title="Overview"
        subtitle="Optimization-Based Multi-Criteria Decision Support System"
      />

      <div className="page-body animate-fadein">
        {/* ── Welcome ────────────────────────────────────── */}
        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{ color: "var(--color-text-primary)", marginBottom: 4 }}>
            Welcome back,{" "}
            <span className="gradient-text">{firstName}</span> 👋
          </h2>
          <p style={{ color: "var(--color-text-muted)", fontSize: 13 }}>
            Here&apos;s a snapshot of your faculty recruitment pipeline.
          </p>
        </div>

        {/* ── KPI Stats ──────────────────────────────────── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "1rem",
            marginBottom: "2rem",
          }}
        >
          {STAT_CARDS.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.id} id={stat.id} className="card" style={{ padding: "1.25rem" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 10,
                  }}
                >
                  <span style={{ fontSize: 12, color: "var(--color-text-muted)", fontWeight: 500 }}>
                    {stat.label}
                  </span>
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: "var(--radius-sm)",
                      background: `${stat.color}20`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon size={14} color={stat.color} />
                  </div>
                </div>
                <div style={{ fontSize: 26, fontWeight: 700, color: stat.color }}>
                  {stat.value}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Dashboard Charts ───────────────────────────── */}
        <DashboardCharts 
          scoreDistribution={stats.score_distribution} 
          departmentAllocations={stats.department_allocations} 
        />

        {/* ── Module Cards ───────────────────────────────── */}
        <div style={{ marginBottom: "1.5rem" }}>
          <h3 style={{ color: "var(--color-text-primary)", marginBottom: 4 }}>
            System Modules
          </h3>
          <p style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
            Five integrated modules power the decision support pipeline.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1rem",
          }}
        >
          {MODULES.map((mod, i) => {
            const Icon = mod.icon;
            return (
              <div
                key={mod.href}
                id={mod.id}
                className="card animate-fadein"
                style={{
                  animationDelay: `${i * 60}ms`,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                {/* Header row */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "var(--radius-md)",
                      background: "var(--color-accent-subtle)",
                      border: "1px solid hsla(243, 50%, 50%, 0.25)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={18} color="var(--color-accent-hover)" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 2,
                      }}
                    >
                      <h4 style={{ fontSize: 14, color: "var(--color-text-primary)" }}>
                        {mod.title}
                      </h4>
                    </div>
                    <p
                      style={{
                        fontSize: 12,
                        color: "var(--color-text-muted)",
                        lineHeight: 1.5,
                      }}
                    >
                      {mod.description}
                    </p>
                  </div>
                </div>

                {/* Stat row */}
                {mod.stat && (
                  <div
                    style={{
                      padding: "8px 12px",
                      background: "var(--color-bg-elevated)",
                      borderRadius: "var(--radius-sm)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                      {mod.stat.label}
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--color-text-primary)",
                      }}
                    >
                      {mod.stat.value}
                    </span>
                  </div>
                )}

                {/* CTA */}
                <div style={{ marginTop: "auto" }}>
                  {mod.status === "coming-soon" ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 12,
                        color: "var(--color-text-muted)",
                      }}
                    >
                      <Clock size={12} />
                      Coming in Phase 2
                    </div>
                  ) : (
                    <a
                      href={mod.href}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 12,
                        fontWeight: 500,
                        color: "var(--color-accent)",
                      }}
                    >
                      Open module <ArrowRight size={12} />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
