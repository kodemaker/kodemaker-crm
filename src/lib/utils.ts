import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { useCallback } from "react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a date string to a locale string without seconds.
 * Example: "12/12/2025, 9:00:00 AM" -> "12.12.2025, 09:00"
 */
export function formatDateTimeWithoutSeconds(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  const localeString = d.toLocaleString("nb-NO", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return localeString;
}

/**
 * Formats a date string to Norwegian locale date format.
 * Example: "2025-01-15" -> "15.01.2025"
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
}

/**
 * Formats a date string to short format with abbreviated month.
 * Example: "2025-01-23" -> "23. jan 25"
 */
export function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  const day = date.getDate();
  const month = date.toLocaleDateString("nb-NO", { month: "short" }).replace(".", "");
  const year = date.getFullYear().toString().slice(-2);
  return `${day}. ${month} ${year}`;
}

/**
 * Returns background color style based on due date proximity:
 * - Neutral (no background): 2+ days until due date
 * - Yellow: 0-2 days until due date (intensity increases as deadline approaches)
 * - Red: Overdue (intensity increases up to 14 days overdue, then stays at max)
 */
export function useDueBgStyle() {
  return useCallback((dueAt: string): React.CSSProperties => {
    const now = Date.now();
    const due = new Date(dueAt).getTime();
    const dayMs = 24 * 60 * 60 * 1000;
    const diffDays = (due - now) / dayMs;
    // Neutral: 2+ days until due
    if (diffDays >= 2) return {};
    // Yellow: 0-2 days until due (gets more intense as deadline approaches)
    if (diffDays >= 0) {
      const t = 1 - Math.min(2, Math.max(0, diffDays)) / 2;
      const lightness = 95 - 10 * t;
      return { backgroundColor: `hsl(45 95% ${lightness}%)` };
    }
    // Red: Overdue (gets more intense up to 14 days, then stays at max)
    const overdue = Math.min(14, -diffDays);
    const t = overdue / 14;
    const lightness = 96 - 26 * t;
    return { backgroundColor: `hsl(0 92% ${lightness}%)` };
  }, []);
}

/**
 * Generates initials from first and last name.
 * Example: "Marina" "Santos Haugen" -> "MS"
 */
export function getInitials(firstName: string, lastName: string): string {
  const first = firstName?.[0]?.toUpperCase() ?? "";
  const last = lastName?.[0]?.toUpperCase() ?? "";
  return `${first}${last}`;
}

/**
 * Returns a default due date for followups: 7 days from now at 09:00.
 */
export function getDefaultDueDate(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  d.setHours(9, 0, 0, 0);
  return d;
}

/**
 * Returns Norwegian label for lead status.
 */
export function getLeadStatusLabel(
  status: "NEW" | "IN_PROGRESS" | "ON_HOLD" | "LOST" | "WON" | "BORTFALT"
): string {
  const labels: Record<"NEW" | "IN_PROGRESS" | "ON_HOLD" | "LOST" | "WON" | "BORTFALT", string> = {
    NEW: "Ny lead",
    IN_PROGRESS: "Lead under arbeid",
    ON_HOLD: "Lead på vent",
    LOST: "Tapt lead",
    WON: "Vunnet lead",
    BORTFALT: "Bortfalt lead",
  };
  return labels[status] ?? status;
}

/**
 * Formats a number as Norwegian currency (NOK).
 * Example: 500000 -> "kr 500 000"
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("nb-NO", {
    style: "currency",
    currency: "NOK",
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Truncates text to a maximum length, appending ellipsis if truncated.
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}…`;
}
