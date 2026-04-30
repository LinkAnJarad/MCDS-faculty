import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { HiredList } from "./components/HiredList";

export const metadata: Metadata = {
  title: "Hired Faculty",
};

export default function HiredPage() {
  return (
    <>
      <Header
        title="Hired Faculty"
        subtitle="Finalized allocations and hired personnel"
      />
      <div className="page-body animate-fadein">
        <HiredList />
      </div>
    </>
  );
}
