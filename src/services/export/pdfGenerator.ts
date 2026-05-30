import jsPDF from "jspdf";
import type { Charter } from "@/types/charter";
import { SECTION_LABELS } from "@/types/charter";
import { PDF_COLORS, PDF_LAYOUT } from "./pdfStyles";
import { formatISODate, formatCurrency } from "@/lib/exportUtils";

const L = PDF_LAYOUT;
const C = PDF_COLORS;

/**
 * Generate a print-ready A4 PDF from a Charter using jsPDF direct drawing.
 * No DOM capture needed — pure data-driven rendering.
 */
export async function generatePDF(charter: Charter): Promise<Blob> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = L.marginTop;

  const checkPage = (needed: number) => {
    if (y + needed > L.pageHeight - L.marginBottom) {
      doc.addPage();
      y = L.marginTop;
    }
  };

  const heading = (text: string) => {
    checkPage(14);
    y += 4;
    doc.setFillColor(C.primaryLight);
    doc.rect(L.marginLeft, y - 4, L.contentWidth, 10, "F");
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(C.primary);
    doc.text(text, L.marginLeft + 3, y + 3);
    y += 12;
    doc.setTextColor(C.text);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
  };

  const label = (text: string) => {
    checkPage(8);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(C.textMuted);
    doc.text(text, L.marginLeft + 2, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(C.text);
    doc.setFontSize(10);
  };

  const body = (text: string) => {
    if (!text) return;
    checkPage(6);
    const lines = doc.splitTextToSize(text, L.contentWidth - 4);
    lines.forEach((line: string) => {
      checkPage(5);
      doc.text(line, L.marginLeft + 2, y);
      y += 4.5;
    });
    y += 2;
  };

  const bullet = (items: string[]) => {
    items.forEach((item) => {
      checkPage(6);
      doc.text(`•  ${item}`, L.marginLeft + 4, y);
      y += 4.5;
    });
    y += 2;
  };

  // ── Title page ──
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(C.primary);
  doc.text(charter.basics.projectName || "Project Charter", L.marginLeft, y + 10);
  y += 18;

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(C.textMuted);
  doc.text("Project Charter", L.marginLeft, y);
  y += 10;

  doc.setFontSize(10);
  doc.setTextColor(C.text);
  const meta = [
    `Sponsor: ${charter.basics.sponsor || "—"}`,
    `Project Manager: ${charter.basics.projectManager || "—"}`,
    `Start: ${formatISODate(charter.basics.startDate)}`,
    `Target End: ${formatISODate(charter.basics.targetEndDate)}`,
    `Generated: ${formatISODate(new Date().toISOString())}`,
  ];
  meta.forEach((line) => {
    doc.text(line, L.marginLeft, y);
    y += 5;
  });
  y += 6;

  // ── Executive Summary ──
  heading(SECTION_LABELS.basics);
  body(charter.basics.summary);

  // ── Goals & Objectives ──
  heading(SECTION_LABELS.goals);
  label("Vision");
  body(charter.goals.visionStatement);
  label("Business Case");
  body(charter.goals.businessCase);

  if (charter.goals.objectives.length > 0) {
    label("Objectives");
    charter.goals.objectives.forEach((o) => {
      checkPage(10);
      doc.setFont("helvetica", "bold");
      doc.text(`•  ${o.statement}`, L.marginLeft + 4, y);
      y += 4.5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Metric: ${o.metric}  |  Priority: ${o.priority}`, L.marginLeft + 8, y);
      doc.setFontSize(10);
      y += 5;
    });
    y += 2;
  }

  if (charter.goals.successCriteria.length > 0) {
    label("Success Criteria");
    bullet(charter.goals.successCriteria);
  }

  // ── Stakeholders ──
  heading(SECTION_LABELS.stakeholders);
  if (charter.stakeholders.stakeholders.length > 0) {
    const cols = [L.marginLeft + 2, L.marginLeft + 50, L.marginLeft + 95, L.marginLeft + 120, L.marginLeft + 140];
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Name", cols[0], y);
    doc.text("Role", cols[1], y);
    doc.text("Category", cols[2], y);
    doc.text("Influence", cols[3], y);
    doc.text("Interest", cols[4], y);
    y += 2;
    doc.setDrawColor(C.border);
    doc.line(L.marginLeft, y, L.marginLeft + L.contentWidth, y);
    y += 4;
    doc.setFont("helvetica", "normal");

    charter.stakeholders.stakeholders.forEach((s) => {
      checkPage(6);
      doc.text(s.name, cols[0], y);
      doc.text(s.role, cols[1], y);
      doc.text(s.category, cols[2], y);
      doc.text(String(s.influence), cols[3] + 5, y);
      doc.text(String(s.interest), cols[4] + 5, y);
      y += 5;
    });
    y += 4;
    doc.setFontSize(10);
  }

  // ── Scope & Constraints ──
  heading(SECTION_LABELS.scope);
  if (charter.scope.inScope.length > 0) {
    label("In Scope");
    bullet(charter.scope.inScope);
  }
  if (charter.scope.outOfScope.length > 0) {
    label("Out of Scope");
    bullet(charter.scope.outOfScope);
  }
  if (charter.scope.constraints.length > 0) {
    label("Constraints");
    charter.scope.constraints.forEach((c) => {
      checkPage(6);
      doc.text(`•  [${c.type}] ${c.description}`, L.marginLeft + 4, y);
      y += 5;
    });
    y += 2;
  }

  // ── Risks & Assumptions ──
  heading(SECTION_LABELS.risks);
  if (charter.risks.risks.length > 0) {
    label("Risk Register");
    charter.risks.risks.forEach((r) => {
      checkPage(12);
      doc.setFont("helvetica", "bold");
      doc.text(`•  ${r.description}`, L.marginLeft + 4, y);
      y += 4.5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(
        `Prob: ${r.probability}  |  Impact: ${r.impact}  |  Mitigation: ${r.mitigation}`,
        L.marginLeft + 8,
        y,
      );
      doc.setFontSize(10);
      y += 5;
    });
    y += 2;
  }
  if (charter.risks.assumptions.length > 0) {
    label("Assumptions");
    bullet(charter.risks.assumptions);
  }
  if (charter.risks.dependencies.length > 0) {
    label("Dependencies");
    bullet(charter.risks.dependencies);
  }

  // ── Deliverables ──
  heading(SECTION_LABELS.deliverables);
  charter.deliverables.deliverables.forEach((d) => {
    checkPage(18);
    doc.setFont("helvetica", "bold");
    doc.text(d.name, L.marginLeft + 2, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Due: ${formatISODate(d.dueDate)}`, L.marginLeft + L.contentWidth - 40, y);
    doc.setFontSize(10);
    y += 5;
    body(d.description);
    if (d.acceptanceCriteria) {
      doc.setFontSize(9);
      doc.setTextColor(C.textMuted);
      doc.text(`Acceptance: ${d.acceptanceCriteria}`, L.marginLeft + 4, y);
      doc.setTextColor(C.text);
      doc.setFontSize(10);
      y += 5;
    }
    y += 2;
  });

  // ── Timeline & Budget ──
  heading(SECTION_LABELS.timeline);
  if (charter.timeline.milestones.length > 0) {
    label("Milestones");
    charter.timeline.milestones.forEach((m) => {
      checkPage(6);
      doc.text(
        `•  ${m.title}  —  ${formatISODate(m.date)}  (${m.type})`,
        L.marginLeft + 4,
        y,
      );
      y += 5;
    });
    y += 2;
  }

  label("Budget");
  body(
    `${formatCurrency(charter.timeline.totalBudget, charter.timeline.currency)}${
      charter.timeline.budgetNotes ? `  —  ${charter.timeline.budgetNotes}` : ""
    }`,
  );

  // ── Footer on every page ──
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(C.textMuted);
    doc.text(
      `${charter.basics.projectName || "Project Charter"}  •  Page ${i} of ${pageCount}`,
      L.marginLeft,
      L.pageHeight - 10,
    );
  }

  return doc.output("blob");
}
