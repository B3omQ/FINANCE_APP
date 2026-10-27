import { format, parse, isValid, startOfMonth, endOfMonth } from "date-fns";

export type DateOnly = string; // YYYY-MM-DD
export type MonthKey = string; // YYYY-MM
export type ISODateTime = string;

/**
 * Returns current date in user's local timezone as YYYY-MM-DD.
 */
export function today(): DateOnly {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Returns current timestamp in ISO 8601 UTC.
 */
export function nowISO(): ISODateTime {
  return new Date().toISOString();
}

/**
 * Converts a DateOnly or Date or ISO string into a month key 'YYYY-MM'.
 */
export function toMonthKey(date: DateOnly | Date): MonthKey {
  if (typeof date === "string") {
    // If string is YYYY-MM-DD...
    return date.slice(0, 7);
  }
  return format(date, "yyyy-MM");
}

/**
 * Returns the start and end DateOnly for a given month 'YYYY-MM'.
 */
export function monthRange(month: MonthKey): { start: DateOnly; end: DateOnly } {
  // Parse month 'YYYY-MM-01'
  const date = parse(`${month}-01`, "yyyy-MM-dd", new Date());
  if (!isValid(date)) {
    throw new Error(`Invalid month key: ${month}. Expected YYYY-MM.`);
  }

  const startDate = startOfMonth(date);
  const endDate = endOfMonth(date);

  return {
    start: format(startDate, "yyyy-MM-dd"),
    end: format(endDate, "yyyy-MM-dd"),
  };
}

/**
 * Formats a DateOnly string to localized Vietnamese format dd/MM/yyyy.
 */
export function formatDate(dateStr: DateOnly): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  return dateStr;
}

/**
 * Parses user or CSV input date into DateOnly (YYYY-MM-DD).
 * Supports: dd/MM/yyyy, yyyy-MM-dd, dd-MM-yyyy.
 */
export function parseToDateOnly(input: string): DateOnly | null {
  if (!input) return null;
  const trimmed = input.trim();

  // If already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const d = parse(trimmed, "yyyy-MM-dd", new Date());
    return isValid(d) ? trimmed : null;
  }

  // If dd/MM/yyyy
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
    const d = parse(trimmed, "d/M/yyyy", new Date());
    return isValid(d) ? format(d, "yyyy-MM-dd") : null;
  }

  // If dd-MM-yyyy
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(trimmed)) {
    const d = parse(trimmed, "d-M-yyyy", new Date());
    return isValid(d) ? format(d, "yyyy-MM-dd") : null;
  }

  return null;
}
