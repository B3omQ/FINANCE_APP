import type { DateOnly, RecurringRule } from "./types";

/**
 * Checks if a given year is a leap year.
 */
function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Returns number of days in a given year and month (1-indexed: 1 = Jan, 12 = Dec).
 */
function getDaysInMonth(year: number, month: number): number {
  if (month === 2) {
    return isLeapYear(year) ? 29 : 28;
  }
  if ([4, 6, 9, 11].includes(month)) {
    return 30;
  }
  return 31;
}

/**
 * Parses YYYY-MM-DD into [year, month, day].
 */
function parseDateParts(dateStr: DateOnly): [number, number, number] {
  const [y, m, d] = dateStr.split("-").map(Number);
  return [y ?? 1970, m ?? 1, d ?? 1];
}

/**
 * Formats [year, month, day] to YYYY-MM-DD.
 */
function formatDateParts(y: number, m: number, d: number): DateOnly {
  const yearStr = String(y).padStart(4, "0");
  const monthStr = String(m).padStart(2, "0");
  const dayStr = String(d).padStart(2, "0");
  return `${yearStr}-${monthStr}-${dayStr}`;
}

/**
 * Advances a date by N days.
 */
function advanceDays(dateStr: DateOnly, days: number): DateOnly {
  const [y, m, d] = parseDateParts(dateStr);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  return formatDateParts(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

/**
 * Advances a date by N months, preserving anchor day clamped to the end of month.
 * E.g., Jan 31 + 1 month -> Feb 28 (or 29)
 * Jan 31 + 2 months -> Mar 31
 */
function advanceMonths(
  startYear: number,
  startMonth: number,
  anchorDay: number,
  monthOffset: number
): DateOnly {
  const totalMonths = startMonth - 1 + monthOffset;
  const targetYear = startYear + Math.floor(totalMonths / 12);
  const targetMonth = (totalMonths % 12) + 1;

  const maxDays = getDaysInMonth(targetYear, targetMonth);
  const targetDay = Math.min(anchorDay, maxDays);

  return formatDateParts(targetYear, targetMonth, targetDay);
}

/**
 * Advances a date by N years, clamping Feb 29 to Feb 28 on non-leap years.
 */
function advanceYears(
  startYear: number,
  startMonth: number,
  anchorDay: number,
  yearOffset: number
): DateOnly {
  const targetYear = startYear + yearOffset;
  const maxDays = getDaysInMonth(targetYear, startMonth);
  const targetDay = Math.min(anchorDay, maxDays);

  return formatDateParts(targetYear, startMonth, targetDay);
}

/**
 * Generates due dates for a recurring rule from lastGeneratedDate (or startDate) up to today.
 *
 * Rules:
 * - If rule is inactive, returns []
 * - Respects endDate (never generates after endDate)
 * - Never generates dates > today
 * - Correctly handles month ends (31 -> 30 / 28)
 * - Returns chronological list of DateOnly strings
 */
export function generateDue(rule: RecurringRule, todayDate: DateOnly): DateOnly[] {
  if (!rule.active) {
    return [];
  }

  const interval = Math.max(1, rule.interval || 1);
  const [startYear, startMonth, startDay] = parseDateParts(rule.startDate);

  // If start date is in the future
  if (rule.startDate > todayDate) {
    return [];
  }

  const dueDates: DateOnly[] = [];

  // Determine starting point
  if (!rule.lastGeneratedDate) {
    // Has not been generated before, include startDate
    if (rule.endDate && rule.startDate > rule.endDate) {
      return [];
    }
    dueDates.push(rule.startDate);
  }

  let currentDate = rule.lastGeneratedDate ?? rule.startDate;
  let safetyCounter = 0;
  const MAX_ITERATIONS = 500; // Safeguard against infinite loops

  // For monthly / yearly calculations, keep track of the original anchor day
  const anchorDay = startDay;

  while (safetyCounter++ < MAX_ITERATIONS) {
    let nextDate: DateOnly;

    if (rule.frequency === "daily") {
      nextDate = advanceDays(currentDate, interval);
    } else if (rule.frequency === "weekly") {
      nextDate = advanceDays(currentDate, interval * 7);
    } else if (rule.frequency === "monthly") {
      // Find current month index from start
      const [cy, cm] = parseDateParts(currentDate);
      const currentMonthOffset = (cy - startYear) * 12 + (cm - startMonth);
      const nextMonthOffset = currentMonthOffset + interval;
      nextDate = advanceMonths(startYear, startMonth, anchorDay, nextMonthOffset);
    } else if (rule.frequency === "yearly") {
      const [cy] = parseDateParts(currentDate);
      const nextYearOffset = cy - startYear + interval;
      nextDate = advanceYears(startYear, startMonth, anchorDay, nextYearOffset);
    } else {
      break;
    }

    // Stop if past today
    if (nextDate > todayDate) {
      break;
    }

    // Stop if past endDate
    if (rule.endDate && nextDate > rule.endDate) {
      break;
    }

    dueDates.push(nextDate);
    currentDate = nextDate;
  }

  return dueDates;
}
