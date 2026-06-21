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
      writeWrapped(`•  ${item}`, L.marginLeft + 4, L.contentWidth - 6);
    });
    y += 2;
  };

  /** Write text wrapped to a max width starting at x, advancing y per line. */
  const writeWrapped = (text: string, x: number, maxWidth: number, lineHeight = 4.5) => {
    if (!text) return;
    const lines: string[] = doc.splitTextToSize(text, maxWidth);
    lines.forEach((line) => {
      checkPage(lineHeight + 1);
      doc.text(line, x, y);
      y += lineHeight;
    });
  };

  /** Bordered card: deliverable name + due date, description, acceptance line. */
  const drawDeliverableCard = (d: Charter["deliverables"]["deliverables"][number]) => {
    const padX = 4;
    const padTop = 4;
    const padBottom = 4;
    const innerWidth = L.contentWidth - padX * 2;
    const dueText = `Due: ${formatISODate(d.dueDate)}`;

    doc.setFontSize(9);
    const dueWidth = doc.getTextWidth(dueText);
    doc.setFontSize(11);
    const nameMaxW = innerWidth - dueWidth - 4;
    const nameLines: string[] = doc.splitTextToSize(d.name, nameMaxW);
    const headerH = nameLines.length * 5;

    doc.setFontSize(10);
    const descLines: string[] = d.description
      ? doc.splitTextToSize(d.description, innerWidth)
      : [];
    const descH = descLines.length * 4.8 + (descLines.length ? 2 : 0);

    doc.setFontSize(9);
    const accLines: string[] = d.acceptanceCriteria
      ? doc.splitTextToSize(`Acceptance: ${d.acceptanceCriteria}`, innerWidth)
      : [];
    const accH = accLines.length * 4.2 + (accLines.length ? 2 : 0);

    const cardH = padTop + headerH + descH + accH + padBottom;
    checkPage(cardH + 3);

    const top = y;
    doc.setDrawColor(C.border);
    doc.setFillColor("#fafbfc");
    doc.roundedRect(L.marginLeft, top, L.contentWidth, cardH, 1.6, 1.6, "FD");

    // Name (top-left) + Due (top-right)
    let cy = top + padTop + 4;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(C.text);
    nameLines.forEach((ln, i) => doc.text(ln, L.marginLeft + padX, cy + i * 5));

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(C.textMuted);
    doc.text(
      dueText,
      L.marginLeft + L.contentWidth - padX,
      top + padTop + 4,
      { align: "right" },
    );

    cy += headerH;

    // Description
    if (descLines.length) {
      cy += 1;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(C.text);
      descLines.forEach((ln, i) => doc.text(ln, L.marginLeft + padX, cy + i * 4.8));
      cy += descLines.length * 4.8 + 1;
    }

    // Acceptance
    if (accLines.length) {
      cy += 1;
      doc.setFontSize(9);
      doc.setTextColor(C.textMuted);
      accLines.forEach((ln, i) => doc.text(ln, L.marginLeft + padX, cy + i * 4.2));
    }

    doc.setTextColor(C.text);
    doc.setFontSize(10);
    y = top + cardH + 3;
  };

  /** Milestone row: colored dot + title + meta on a second line, generous spacing. */
  const drawMilestoneRow = (m: Charter["timeline"]["milestones"][number]) => {
    const dotX = L.marginLeft + 3;
    const textX = L.marginLeft + 8;
    const innerWidth = L.contentWidth - 8;
    const typeColor =
      m.type === "deliverable" ? C.primary :
      m.type === "review" ? C.warning :
      C.success;

    doc.setFontSize(10);
    const titleLines: string[] = doc.splitTextToSize(m.title, innerWidth);
    const rowH = titleLines.length * 5 + 5;
    checkPage(rowH + 2);

    const top = y;
    doc.setFillColor(typeColor);
    doc.circle(dotX, top + 2.4, 1.2, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(C.text);
    titleLines.forEach((ln, i) => doc.text(ln, textX, top + 3 + i * 5));

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(C.textMuted);
    doc.text(
      `${formatISODate(m.date)}  •  ${m.type}`,
      textX,
      top + 3 + titleLines.length * 5,
    );

    doc.setTextColor(C.text);
    doc.setFontSize(10);
    y = top + rowH + 3;
  };

  /** Budget card: large amount, optional notes line below. */
  const drawBudgetCard = () => {
    const amount = formatCurrency(
      charter.timeline.totalBudget,
      charter.timeline.currency,
    );
    const notes = charter.timeline.budgetNotes ?? "";
    const padX = 4;
    const padY = 5;
    const innerWidth = L.contentWidth - padX * 2;

    doc.setFontSize(9);
    const notesLines: string[] = notes
      ? doc.splitTextToSize(notes, innerWidth)
      : [];
    const cardH = padY + 9 + (notesLines.length ? 2 + notesLines.length * 4.2 : 0) + padY;

    checkPage(cardH + 4);
    const top = y + 2;

    doc.setDrawColor(C.border);
    doc.setFillColor(C.primaryLight);
    doc.roundedRect(L.marginLeft, top, L.contentWidth, cardH, 1.6, 1.6, "FD");

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(C.textMuted);
    doc.text("BUDGET", L.marginLeft + padX, top + padY + 2);

    doc.setFontSize(16);
    doc.setTextColor(C.primary);
    doc.text(amount, L.marginLeft + padX, top + padY + 8);

    if (notesLines.length) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(C.text);
      notesLines.forEach((ln, i) =>
        doc.text(ln, L.marginLeft + padX, top + padY + 12 + i * 4.2),
      );
    }

    doc.setTextColor(C.text);
    doc.setFontSize(10);
    y = top + cardH + 3;
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
      writeWrapped(`•  ${o.statement}`, L.marginLeft + 4, L.contentWidth - 6);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      writeWrapped(
        `Metric: ${o.metric}  |  Priority: ${o.priority}`,
        L.marginLeft + 8,
        L.contentWidth - 10,
      );
      doc.setFontSize(10);
      y += 1;
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
      const nameLines: string[] = doc.splitTextToSize(s.name, 46);
      const roleLines: string[] = doc.splitTextToSize(s.role, 43);
      const catLines: string[] = doc.splitTextToSize(s.category, 23);
      const rows = Math.max(nameLines.length, roleLines.length, catLines.length);
      checkPage(rows * 5 + 1);
      const rowY = y;
      nameLines.forEach((ln, i) => doc.text(ln, cols[0], rowY + i * 4.5));
      roleLines.forEach((ln, i) => doc.text(ln, cols[1], rowY + i * 4.5));
      catLines.forEach((ln, i) => doc.text(ln, cols[2], rowY + i * 4.5));
      doc.text(String(s.influence), cols[3] + 5, rowY);
      doc.text(String(s.interest), cols[4] + 5, rowY);
      y = rowY + rows * 4.5 + 0.5;
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
      writeWrapped(`•  [${c.type}] ${c.description}`, L.marginLeft + 4, L.contentWidth - 6);
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
      writeWrapped(`•  ${r.description}`, L.marginLeft + 4, L.contentWidth - 6);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      writeWrapped(
        `Prob: ${r.probability}  |  Impact: ${r.impact}  |  Mitigation: ${r.mitigation}`,
        L.marginLeft + 8,
        L.contentWidth - 10,
      );
      doc.setFontSize(10);
      y += 1;
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
    drawDeliverableCard(d);
  });

  // ── Timeline & Budget ──
  heading(SECTION_LABELS.timeline);
  if (charter.timeline.milestones.length > 0) {
    label("Milestones");
    y += 1;
    charter.timeline.milestones.forEach((m) => {
      drawMilestoneRow(m);
    });
    y += 4;
  }

  drawBudgetCard();

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
