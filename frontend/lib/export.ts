/**
 * Export Utilities — Phase 4 Report Generation
 * Provides PDF (jsPDF + autotable) and Excel (SheetJS/xlsx) exports
 * for Evaluation Rankings and Optimization Allocations.
 */

import type { EvaluationResult, OptimizationResult } from "@/lib/api";

// ── PDF helpers ────────────────────────────────────────────────────────────────

function headerRow(doc: import("jspdf").jsPDF, title: string, subtitle: string) {
  doc.setFillColor(43, 45, 66);
  doc.rect(0, 0, 210, 32, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, 14);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(180, 185, 220);
  doc.text(subtitle, 14, 22);
  doc.setTextColor(160, 160, 180);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 29);
  doc.setTextColor(40, 40, 40);
}

// ── Evaluation PDF ─────────────────────────────────────────────────────────────

export async function exportEvaluationPDF(result: EvaluationResult): Promise<void> {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  headerRow(
    doc,
    "Faculty DSS — MCDM Evaluation Report",
    `Weighted Sum Model · ${result.total_applicants} applicants · ${result.criteria_count} criteria · Total weight: ${result.total_weight.toFixed(1)}%`
  );

  // Summary KPIs
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(40, 40, 40);
  doc.text("Evaluation Summary", 14, 42);

  const summaryData = [
    ["Applicants Evaluated", String(result.total_applicants)],
    ["Active Criteria", String(result.criteria_count)],
    ["Total Weight", `${result.total_weight.toFixed(1)}%`],
    ["Scores Saved to DB", result.scores_saved ? "Yes" : "No (preview)"],
    ["Evaluated At", new Date(result.evaluated_at).toLocaleString()],
  ];

  autoTable(doc, {
    startY: 46,
    body: summaryData,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 60 } },
  });

  // Rankings table
  const lastY = (doc as any).lastAutoTable?.finalY ?? 80;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Applicant Rankings", 14, lastY + 10);

  autoTable(doc, {
    startY: lastY + 14,
    head: [["Rank", "Name", "Email", "Status", "MCDM Score (0–100)"]],
    body: result.rankings.map((r) => [
      `#${r.rank}`,
      `${r.first_name} ${r.last_name}`,
      r.email,
      r.status.charAt(0).toUpperCase() + r.status.slice(1),
      r.mcdm_score.toFixed(4),
    ]),
    theme: "striped",
    headStyles: { fillColor: [67, 97, 238], textColor: 255, fontSize: 9 },
    styles: { fontSize: 9, cellPadding: 3 },
    alternateRowStyles: { fillColor: [245, 246, 255] },
    columnStyles: {
      0: { cellWidth: 15, halign: "center" },
      4: { halign: "right", fontStyle: "bold" },
    },
  });

  doc.save(`evaluation-report-${Date.now()}.pdf`);
}

// ── Evaluation Excel ───────────────────────────────────────────────────────────

export async function exportEvaluationExcel(result: EvaluationResult): Promise<void> {
  const XLSX = await import("xlsx");

  const summaryWS = XLSX.utils.aoa_to_sheet([
    ["Faculty DSS — MCDM Evaluation Report"],
    [],
    ["Applicants Evaluated", result.total_applicants],
    ["Active Criteria", result.criteria_count],
    ["Total Weight (%)", result.total_weight.toFixed(1)],
    ["Scores Saved to DB", result.scores_saved ? "Yes" : "No (preview)"],
    ["Evaluated At", new Date(result.evaluated_at).toLocaleString()],
  ]);

  const rankHeaders = ["Rank", "First Name", "Last Name", "Email", "Status", "MCDM Score"];
  const rankRows = result.rankings.map((r) => [
    r.rank,
    r.first_name,
    r.last_name,
    r.email,
    r.status,
    r.mcdm_score,
  ]);
  const rankingsWS = XLSX.utils.aoa_to_sheet([rankHeaders, ...rankRows]);

  // Breakdown sheet — one row per applicant × criterion
  const breakdownHeaders = ["Applicant", "Criteria", "Data Key", "Weight (%)", "Raw Value", "Normalized", "Weighted Score"];
  const breakdownRows = result.rankings.flatMap((r) =>
    r.breakdown.map((b) => [
      `${r.first_name} ${r.last_name}`,
      b.criteria_name,
      b.data_key,
      b.weight,
      b.raw_value,
      b.normalized_value,
      b.weighted_score,
    ])
  );
  const breakdownWS = XLSX.utils.aoa_to_sheet([breakdownHeaders, ...breakdownRows]);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, summaryWS, "Summary");
  XLSX.utils.book_append_sheet(wb, rankingsWS, "Rankings");
  XLSX.utils.book_append_sheet(wb, breakdownWS, "Criteria Breakdown");
  XLSX.writeFile(wb, `evaluation-report-${Date.now()}.xlsx`);
}

// ── Optimization PDF ───────────────────────────────────────────────────────────

export async function exportOptimizationPDF(result: OptimizationResult): Promise<void> {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  headerRow(
    doc,
    "Faculty DSS — Optimization & Allocation Report",
    `LP / CBC Solver · Status: ${result.status} · ${result.allocation_count} assignments · Total score: ${result.total_score.toFixed(2)}`
  );

  // Summary
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(40, 40, 40);
  doc.text("Solver Summary", 14, 42);

  const summaryData = [
    ["Solver Status", result.status],
    ["Total Alignment Score", result.total_score.toFixed(4)],
    ["Assignments Made", String(result.allocation_count)],
    ["Unallocated Applicants", result.unallocated_applicant_names.join(", ") || "None"],
    ["Unfilled Positions", result.unfilled_position_titles.join(", ") || "None"],
    ["Scores Saved to DB", result.scores_saved ? "Yes" : "No (preview)"],
    ["Solved At", new Date(result.solved_at).toLocaleString()],
    ["Solver Message", result.solver_message],
  ];

  autoTable(doc, {
    startY: 46,
    body: summaryData,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 60 } },
  });

  const lastY = (doc as any).lastAutoTable?.finalY ?? 80;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Assignment Details", 14, lastY + 10);

  autoTable(doc, {
    startY: lastY + 14,
    head: [["Applicant", "Position", "Department", "MCDM Score", "Teaching Units"]],
    body: result.allocations.map((a) => [
      a.applicant_name,
      a.position_title,
      a.department_name ?? "—",
      a.alignment_score.toFixed(4),
      String(a.teaching_units),
    ]),
    theme: "striped",
    headStyles: { fillColor: [67, 97, 238], textColor: 255, fontSize: 9 },
    styles: { fontSize: 9, cellPadding: 3 },
    alternateRowStyles: { fillColor: [245, 246, 255] },
    columnStyles: { 3: { halign: "right" }, 4: { halign: "center" } },
  });

  doc.save(`optimization-report-${Date.now()}.pdf`);
}

// ── Optimization Excel ─────────────────────────────────────────────────────────

export async function exportOptimizationExcel(result: OptimizationResult): Promise<void> {
  const XLSX = await import("xlsx");

  const summaryWS = XLSX.utils.aoa_to_sheet([
    ["Faculty DSS — Optimization & Allocation Report"],
    [],
    ["Solver Status", result.status],
    ["Total Alignment Score", result.total_score],
    ["Assignments Made", result.allocation_count],
    ["Unallocated Applicants", result.unallocated_applicant_names.join(", ") || "None"],
    ["Unfilled Positions", result.unfilled_position_titles.join(", ") || "None"],
    ["Scores Saved to DB", result.scores_saved ? "Yes" : "No (preview)"],
    ["Solved At", new Date(result.solved_at).toLocaleString()],
  ]);

  const allocHeaders = ["Applicant", "Position", "Department", "MCDM Score", "Teaching Units"];
  const allocRows = result.allocations.map((a) => [
    a.applicant_name,
    a.position_title,
    a.department_name ?? "",
    a.alignment_score,
    a.teaching_units,
  ]);
  const allocWS = XLSX.utils.aoa_to_sheet([allocHeaders, ...allocRows]);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, summaryWS, "Summary");
  XLSX.utils.book_append_sheet(wb, allocWS, "Assignments");
  XLSX.writeFile(wb, `optimization-report-${Date.now()}.xlsx`);
}
