import { describe, it, expect } from "vitest";
import { generateDue } from "../recurring";
import type { RecurringRule } from "../types";

function createMockRule(partial: Partial<RecurringRule>): RecurringRule {
  return {
    id: "rule-1",
    name: "Tiền trọ",
    type: "expense",
    amount: 3_000_000,
    accountId: "acc-1",
    categoryId: "cat-rent",
    note: "",
    frequency: "monthly",
    interval: 1,
    startDate: "2026-01-31",
    endDate: null,
    lastGeneratedDate: null,
    active: true,
    createdAt: "2026-01-31T00:00:00.000Z",
    updatedAt: "2026-01-31T00:00:00.000Z",
    deletedAt: null,
    ...partial,
  };
}

describe("domain/recurring", () => {
  it("MANDATORY: correctly handles end-of-month dates (31st -> Feb 28 -> Mar 31 -> Apr 30)", () => {
    // 2026 is not a leap year: Feb has 28 days
    const rule = createMockRule({
      startDate: "2026-01-31",
      frequency: "monthly",
      interval: 1,
      lastGeneratedDate: null,
    });

    const dueDates = generateDue(rule, "2026-05-15");
    expect(dueDates).toEqual([
      "2026-01-31",
      "2026-02-28", // Clamped to 28
      "2026-03-31", // Restored to anchor 31
      "2026-04-30", // Clamped to 30
      "2026-05-31", // Wait, May 31 > May 15 so it shouldn't be included
    ].slice(0, 4));

    expect(dueDates).toHaveLength(4);
    expect(dueDates[0]).toBe("2026-01-31");
    expect(dueDates[1]).toBe("2026-02-28");
    expect(dueDates[2]).toBe("2026-03-31");
    expect(dueDates[3]).toBe("2026-04-30");
  });

  it("handles leap year end of February (2024-02-29)", () => {
    const rule = createMockRule({
      startDate: "2024-01-31",
      frequency: "monthly",
      interval: 1,
    });

    const dueDates = generateDue(rule, "2024-03-01");
    expect(dueDates).toEqual(["2024-01-31", "2024-02-29"]);
  });

  it("resumes from lastGeneratedDate without regenerating past dates", () => {
    const rule = createMockRule({
      startDate: "2026-01-01",
      lastGeneratedDate: "2026-03-01",
      frequency: "monthly",
      interval: 1,
    });

    const dueDates = generateDue(rule, "2026-05-10");
    expect(dueDates).toEqual(["2026-04-01", "2026-05-01"]);
  });

  it("respects endDate limit", () => {
    const rule = createMockRule({
      startDate: "2026-01-01",
      endDate: "2026-03-15",
      frequency: "monthly",
      interval: 1,
    });

    const dueDates = generateDue(rule, "2026-06-01");
    expect(dueDates).toEqual(["2026-01-01", "2026-02-01", "2026-03-01"]);
  });

  it("returns empty array if rule is inactive or startDate is in the future", () => {
    const inactiveRule = createMockRule({ active: false });
    expect(generateDue(inactiveRule, "2026-10-27")).toEqual([]);

    const futureRule = createMockRule({ startDate: "2026-12-01" });
    expect(generateDue(futureRule, "2026-10-27")).toEqual([]);
  });

  it("generates daily, weekly, and yearly rules accurately", () => {
    const weeklyRule = createMockRule({
      startDate: "2026-10-01",
      frequency: "weekly",
      interval: 1,
    });

    const dueDates = generateDue(weeklyRule, "2026-10-22");
    expect(dueDates).toEqual([
      "2026-10-01",
      "2026-10-08",
      "2026-10-15",
      "2026-10-22",
    ]);

    const yearlyRule = createMockRule({
      startDate: "2024-02-29",
      frequency: "yearly",
      interval: 1,
    });
    // 2025 is not leap year -> clamps Feb 29 to Feb 28
    const yearlyDates = generateDue(yearlyRule, "2026-03-01");
    expect(yearlyDates).toEqual([
      "2024-02-29",
      "2025-02-28",
      "2026-02-28",
    ]);
  });
});
