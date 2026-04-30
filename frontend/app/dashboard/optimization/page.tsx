import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { OptimizationClient } from "./components/OptimizationClient";

export const metadata: Metadata = { title: "Workload Optimization" };

export default function OptimizationPage() {
  return (
    <>
      <Header
        title="Optimization & Allocation"
        subtitle="Module 4 — Linear programming faculty-position assignment engine"
      />
      <div className="page-body animate-fadein">
        <OptimizationClient />
      </div>
    </>
  );
}
