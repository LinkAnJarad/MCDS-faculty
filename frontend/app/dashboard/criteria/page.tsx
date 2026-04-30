import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { CriteriaClient } from "./components/CriteriaClient";

export const metadata: Metadata = { title: "Criteria Configuration" };

export default function CriteriaPage() {
  return (
    <>
      <Header
        title="Criteria Configuration"
        subtitle="Module 2 — Define evaluation weights for the MCDM scoring engine"
      />
      <div className="page-body animate-fadein">
        <CriteriaClient />
      </div>
    </>
  );
}
