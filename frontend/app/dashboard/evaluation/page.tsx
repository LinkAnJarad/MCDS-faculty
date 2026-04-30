import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { EvaluationClient } from "./components/EvaluationClient";

export const metadata: Metadata = { title: "MCDM Evaluation" };

export default function EvaluationPage() {
  return (
    <>
      <Header
        title="MCDM Evaluation Engine"
        subtitle="Module 3 — Weighted Sum Model scoring and applicant ranking"
      />
      <div className="page-body animate-fadein">
        <EvaluationClient />
      </div>
    </>
  );
}
