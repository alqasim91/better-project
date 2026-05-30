/** Color palette matching the shadcn indigo/slate theme for PDF consistency. */
export const PDF_COLORS = {
  primary: "#4f46e5",
  primaryLight: "#e0e7ff",
  text: "#0f172a",
  textMuted: "#64748b",
  border: "#e2e8f0",
  background: "#ffffff",
  sectionBg: "#f8fafc",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
} as const;

/** Typography scales for the PDF. */
export const PDF_TYPOGRAPHY = {
  title: { size: 24, weight: "bold" as const, color: PDF_COLORS.primary },
  subtitle: { size: 14, weight: "normal" as const, color: PDF_COLORS.textMuted },
  sectionTitle: { size: 16, weight: "bold" as const, color: PDF_COLORS.text },
  body: { size: 11, weight: "normal" as const, color: PDF_COLORS.text },
  label: { size: 10, weight: "bold" as const, color: PDF_COLORS.textMuted },
  small: { size: 9, weight: "normal" as const, color: PDF_COLORS.textMuted },
} as const;

export const PDF_LAYOUT = {
  pageWidth: 210, // A4 mm
  pageHeight: 297,
  marginTop: 20,
  marginBottom: 20,
  marginLeft: 20,
  marginRight: 20,
  get contentWidth() {
    return this.pageWidth - this.marginLeft - this.marginRight;
  },
} as const;
