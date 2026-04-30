"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  SlidersHorizontal,
  BarChart3,
  Layers,
  ChevronRight,
  GraduationCap,
  CheckCircle,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Faculty Management",
    href: "/dashboard/applicants",
    icon: Users,
  },
  {
    label: "Positions",
    href: "/dashboard/positions",
    icon: Briefcase,
  },
  {
    label: "Criteria Config",
    href: "/dashboard/criteria",
    icon: SlidersHorizontal,
  },
  {
    label: "Evaluation",
    href: "/dashboard/evaluation",
    icon: BarChart3,
  },
  {
    label: "Optimization",
    href: "/dashboard/optimization",
    icon: Layers,
  },
  {
    label: "Hired Faculty",
    href: "/dashboard/hired",
    icon: CheckCircle,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{
        position: "fixed",
        inset: "0 auto 0 0",
        width: "var(--sidebar-width)",
        background: "var(--color-bg-surface)",
        borderRight: "1px solid var(--color-border-subtle)",
        display: "flex",
        flexDirection: "column",
        zIndex: 100,
        overflow: "hidden",
      }}
    >
      {/* ── Logo ─────────────────────────────────────────── */}
      <div
        style={{
          height: "var(--header-height)",
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "0 20px",
          borderBottom: "1px solid var(--color-border-subtle)",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: "var(--radius-md)",
            background: "var(--gradient-brand)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "var(--shadow-accent)",
          }}
        >
          <GraduationCap size={18} color="#fff" />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, lineHeight: 1.2 }}>
            Faculty DSS
          </div>
          <div
            style={{ fontSize: 10, color: "var(--color-text-muted)", fontWeight: 500 }}
          >
            RECRUITMENT SYSTEM
          </div>
        </div>
      </div>

      {/* ── Navigation ───────────────────────────────────── */}
      <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto" }}>
        <p
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: "var(--color-text-muted)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            padding: "8px 10px 6px",
          }}
        >
          Modules
        </p>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              id={`sidebar-nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 10px",
                borderRadius: "var(--radius-sm)",
                marginBottom: 2,
                color: isActive
                  ? "var(--color-text-primary)"
                  : "var(--color-text-secondary)",
                background: isActive ? "var(--color-accent-subtle)" : "transparent",
                border: isActive
                  ? "1px solid hsla(243, 50%, 50%, 0.3)"
                  : "1px solid transparent",
                textDecoration: "none",
                transition: "all var(--transition-fast)",
                position: "relative",
              }}
              className="sidebar-link"
            >
              {/* Active indicator bar */}
              {isActive && (
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: "20%",
                    height: "60%",
                    width: 3,
                    borderRadius: "0 3px 3px 0",
                    background: "var(--gradient-brand)",
                  }}
                />
              )}

              <Icon
                size={16}
                color={isActive ? "var(--color-accent-hover)" : "currentcolor"}
                strokeWidth={isActive ? 2.5 : 1.8}
              />

              <span style={{ flex: 1, fontSize: 13, fontWeight: isActive ? 600 : 400 }}>
                {item.label}
              </span>

              {isActive && (
                <ChevronRight size={13} color="var(--color-accent)" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Footer ───────────────────────────────────────── */}
      <div
        style={{
          padding: "12px 20px",
          borderTop: "1px solid var(--color-border-subtle)",
        }}
      >
        <p style={{ fontSize: 10, color: "var(--color-text-muted)", textAlign: "center" }}>
          ISO/IEC 25010 Compliant
        </p>
      </div>
    </aside>
  );
}
