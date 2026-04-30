"use client";

import { UserButton } from "@clerk/nextjs";
import { Bell } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <header
      style={{
        height: "var(--header-height)",
        background: "var(--color-bg-surface)",
        borderBottom: "1px solid var(--color-border-subtle)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        flexShrink: 0,
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      {/* ── Breadcrumb / Title ─────────────────────────── */}
      <div>
        <h1
          style={{
            fontSize: 16,
            fontWeight: 700,
            lineHeight: 1.2,
            color: "var(--color-text-primary)",
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            style={{
              fontSize: 12,
              color: "var(--color-text-muted)",
              marginTop: 1,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* ── Right actions ─────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Notification bell (placeholder for Phase 4) */}
        <button
          id="header-notifications-btn"
          aria-label="Notifications"
          style={{
            width: 36,
            height: 36,
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--color-border)",
            background: "var(--color-bg-elevated)",
            color: "var(--color-text-secondary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all var(--transition-fast)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "var(--color-bg-hover)";
            (e.currentTarget as HTMLButtonElement).style.color =
              "var(--color-text-primary)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "var(--color-bg-elevated)";
            (e.currentTarget as HTMLButtonElement).style.color =
              "var(--color-text-secondary)";
          }}
        >
          <Bell size={15} />
        </button>

        {/* Clerk user avatar */}
        <UserButton
          appearance={{
            elements: {
              avatarBox: {
                width: 34,
                height: 34,
              },
            },
          }}
        />
      </div>
    </header>
  );
}
