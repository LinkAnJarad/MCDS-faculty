import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { ApplicantsClient } from "./components/ApplicantsClient";

export const metadata: Metadata = { title: "Faculty Management" };

export default function ApplicantsPage() {
  return (
    <>
      <Header
        title="Faculty Management"
        subtitle="Module 1 — Centralized applicant profiles and recruitment pipeline"
      />
      <div className="page-body animate-fadein">
        <ApplicantsClient />
      </div>
    </>
  );
}
