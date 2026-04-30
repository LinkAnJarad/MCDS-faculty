import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { PositionsClient } from "./components/PositionsClient";

export const metadata: Metadata = { title: "Positions & Departments" };

export default function PositionsPage() {
  return (
    <>
      <Header
        title="Positions & Departments"
        subtitle="Manage open faculty positions and the departments that own them"
      />
      <div className="page-body animate-fadein">
        <PositionsClient />
      </div>
    </>
  );
}
