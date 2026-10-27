import { describe, it, expect } from "vitest";
import { formatMoney } from "../formatMoney";
import { parseAmount } from "../parseAmount";
import { today, toMonthKey, monthRange, formatDate, parseToDateOnly } from "../date";
import { generateId } from "../uuid";

describe("shared/lib/parseAmount", () => {
  it("parses shorthand k correctly", () => {
    expect(parseAmount("50k")).toBe(50_000);
    expect(parseAmount("100K")).toBe(100_000);
    expect(parseAmount("2k5")).toBe(2_500);
    expect(parseAmount("1.5k")).toBe(1_500);
  });

  it("parses shorthand tr / m correctly", () => {
    expect(parseAmount("1tr")).toBe(1_000_000);
    expect(parseAmount("1tr2")).toBe(1_200_000);
    expect(parseAmount("2tr5")).toBe(2_500_000);
    expect(parseAmount("1.5tr")).toBe(1_500_000);
    expect(parseAmount("1,5tr")).toBe(1_500_000);
    expect(parseAmount("10M")).toBe(10_000_000);
  });

  it("parses shorthand ty / b correctly", () => {
    expect(parseAmount("1ty")).toBe(1_000_000_000);
    expect(parseAmount("1ty5")).toBe(1_500_000_000);
    expect(parseAmount("2.5b")).toBe(2_500_000_000);
  });

  it("parses numbers with dots, commas and raw digits", () => {
    expect(parseAmount("1.500.000")).toBe(1_500_000);
    expect(parseAmount("1,500,000")).toBe(1_500_000);
    expect(parseAmount("1500000")).toBe(1_500_000);
    expect(parseAmount(" 50000 ")).toBe(50_000);
  });

  it("returns null for invalid or negative inputs", () => {
    expect(parseAmount("")).toBeNull();
    expect(parseAmount("0")).toBeNull();
    expect(parseAmount("-50k")).toBeNull();
    expect(parseAmount("-100000")).toBeNull();
    expect(parseAmount("abc")).toBeNull();
    expect(parseAmount(null)).toBeNull();
    expect(parseAmount(undefined)).toBeNull();
  });
});

describe("shared/lib/formatMoney", () => {
  it("formats positive numbers in VND format", () => {
    expect(formatMoney(1500000)).toBe("1.500.000 ₫");
    expect(formatMoney(50000)).toBe("50.000 ₫");
  });

  it("formats negative numbers", () => {
    expect(formatMoney(-50000)).toBe("-50.000 ₫");
  });

  it("supports showSign option", () => {
    expect(formatMoney(100000, { showSign: true })).toBe("+100.000 ₫");
    expect(formatMoney(-100000, { showSign: true })).toBe("-100.000 ₫");
  });
});

describe("shared/lib/date", () => {
  it("today() returns valid YYYY-MM-DD", () => {
    const d = today();
    expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("toMonthKey extracts YYYY-MM", () => {
    expect(toMonthKey("2026-10-27")).toBe("2026-10");
    expect(toMonthKey(new Date(2026, 9, 27))).toBe("2026-10");
  });

  it("monthRange calculates start and end dates correctly", () => {
    const range = monthRange("2026-02");
    expect(range.start).toBe("2026-02-01");
    expect(range.end).toBe("2026-02-28");

    const leapRange = monthRange("2024-02");
    expect(leapRange.start).toBe("2024-02-01");
    expect(leapRange.end).toBe("2024-02-29");
  });

  it("formatDate formats to dd/MM/yyyy", () => {
    expect(formatDate("2026-10-27")).toBe("27/10/2026");
  });

  it("parseToDateOnly parses various formats", () => {
    expect(parseToDateOnly("2026-10-27")).toBe("2026-10-27");
    expect(parseToDateOnly("27/10/2026")).toBe("2026-10-27");
    expect(parseToDateOnly("27-10-2026")).toBe("2026-10-27");
    expect(parseToDateOnly("invalid")).toBeNull();
  });
});

describe("shared/lib/uuid", () => {
  it("generates valid UUID v4", () => {
    const id = generateId();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });
});
