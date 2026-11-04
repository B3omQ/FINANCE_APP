import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRepositories } from "@/app/providers";
import { generateDue } from "@/domain/recurring";
import { today } from "@/shared/lib/date";
import type { Repositories } from "@/data/repositories/types";

let isGlobalProcessing = false;

/**
 * Pure business process: checks all active recurring rules, generates due transactions up to targetDate,
 * and updates each rule's lastGeneratedDate.
 * Guaranteed idempotency: running multiple times does NOT generate duplicate transactions.
 */
export async function processDueRecurringRules(
  repos: Repositories,
  targetDate: string = today()
): Promise<{ generatedCount: number; processedRuleCount: number }> {
  if (isGlobalProcessing) {
    return { generatedCount: 0, processedRuleCount: 0 };
  }

  isGlobalProcessing = true;
  try {
    const activeRules = await repos.recurring.list(true);
    let totalGenerated = 0;
    let rulesUpdated = 0;

    for (const rule of activeRules) {
      const dueDates = generateDue(rule, targetDate);
      if (dueDates.length === 0) continue;

      for (const dueDate of dueDates) {
        const signedAmount = rule.type === "expense" ? -Math.abs(rule.amount) : Math.abs(rule.amount);
        await repos.transactions.create({
          date: dueDate,
          amount: signedAmount,
          type: rule.type,
          accountId: rule.accountId,
          categoryId: rule.categoryId,
          note: rule.note ? `${rule.name}: ${rule.note}` : rule.name,
          recurringRuleId: rule.id,
        });
        totalGenerated++;
      }

      const lastDueDate = dueDates[dueDates.length - 1];
      if (lastDueDate) {
        await repos.recurring.markGenerated(rule.id, lastDueDate);
        rulesUpdated++;
      }
    }

    return { generatedCount: totalGenerated, processedRuleCount: rulesUpdated };
  } finally {
    isGlobalProcessing = false;
  }
}

/**
 * React hook that triggers recurring rule processing on app startup.
 */
export function useRecurringAutoProcess() {
  const repos = useRepositories();
  const queryClient = useQueryClient();
  const hasTriggeredRef = useRef(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ generatedCount: number; processedRuleCount: number } | null>(null);

  const runProcess = useCallback(async () => {
    setIsProcessing(true);
    try {
      const res = await processDueRecurringRules(repos);
      setResult(res);
      if (res.generatedCount > 0) {
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
        queryClient.invalidateQueries({ queryKey: ["account-balances"] });
        queryClient.invalidateQueries({ queryKey: ["accounts"] });
        queryClient.invalidateQueries({ queryKey: ["recurring-rules"] });
      }
      return res;
    } finally {
      setIsProcessing(false);
    }
  }, [repos, queryClient]);

  useEffect(() => {
    if (!hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      runProcess();
    }
  }, [runProcess]);

  return {
    isProcessing,
    result,
    runProcess,
  };
}
