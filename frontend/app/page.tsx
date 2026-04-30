import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { GraduationCap, ArrowRight, Shield, BarChart2, Layers } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Faculty DSS — Home",
};

export default async function HomePage() {
  const { userId } = await auth();

  // Redirect already-signed-in users straight to the dashboard
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        background: "var(--color-bg-base)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* ── Atmospheric glows ──────────────────────────────── */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          width: 700,
          height: 700,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, hsla(243,75%,60%,0.15) 0%, transparent 65%)",
          top: -300,
          left: "50%",
          transform: "translateX(-50%)",
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, hsla(280,70%,55%,0.10) 0%, transparent 70%)",
          bottom: -200,
          right: -100,
          pointerEvents: "none",
        }}
      />

      {/* ── Hero content ───────────────────────────────────── */}
      <div
        className="animate-fadein"
        style={{ maxWidth: 680, textAlign: "center", position: "relative", zIndex: 1 }}
      >
        {/* Logo mark */}
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "var(--radius-lg)",
            background: "var(--gradient-brand)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
            boxShadow: "var(--shadow-accent)",
          }}
        >
          <GraduationCap size={32} color="#fff" />
        </div>

        <div style={{ marginBottom: 12 }}>
          <span className="badge badge-accent" style={{ fontSize: 11 }}>
            ISO/IEC 25010 Compliant
          </span>
        </div>

        <h1 style={{ marginBottom: 16 }}>
          <span className="gradient-text">Optimization-Based</span>
          <br />
          Faculty Recruitment DSS
        </h1>

        <p
          style={{
            fontSize: 16,
            color: "var(--color-text-secondary)",
            lineHeight: 1.7,
            marginBottom: 36,
          }}
        >
          A structured, data-driven Decision Support System that eliminates bias
          and inefficiency in academic hiring — powered by Multi-Criteria
          Decision Making and linear programming optimization.
        </p>

        {/* CTA buttons */}
        <div
          style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 48 }}
        >
          <Link href="/sign-in" id="hero-sign-in-btn">
            <button className="btn btn-primary" style={{ padding: "0.7rem 1.6rem", fontSize: 15 }}>
              Sign In <ArrowRight size={16} />
            </button>
          </Link>
          <Link href="/sign-up" id="hero-sign-up-btn">
            <button className="btn btn-ghost" style={{ padding: "0.7rem 1.6rem", fontSize: 15 }}>
              Create Account
            </button>
          </Link>
        </div>

        {/* Feature pills */}
        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {[
            { icon: Shield, label: "Clerk Authentication & RBAC" },
            { icon: BarChart2, label: "MCDM Evaluation Engine" },
            { icon: Layers, label: "LP Workload Optimization" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="glass"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 14px",
                borderRadius: "var(--radius-xl)",
                fontSize: 12,
                color: "var(--color-text-secondary)",
              }}
            >
              <Icon size={13} color="var(--color-accent)" />
              {label}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
