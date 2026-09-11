export const MONTHS = [
  "September", "Oktober", "November", "Desember", "Januari",
  "Februari", "Maret", "April", "Mei", "Juni"
] as const;

export const WEEKS = [1, 2, 3, 4, 5] as const;
export const DEFAULT_WEEKLY_FEE = 5000;
export const ACADEMIC_YEAR = "2026/2027";

// Keep these aligned with the workbook's monthly active-week configuration.
// Adjust only if the workbook's rules are intentionally changed.
export const ACTIVE_WEEKS: Record<string, number> = {
  September: 4,
  Oktober: 5,
  November: 4,
  Desember: 4,
  Januari: 4,
  Februari: 4,
  Maret: 5,
  April: 4,
  Mei: 4,
  Juni: 4
};
