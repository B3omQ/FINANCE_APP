import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRepositories } from "@/app/providers";
import type { ID, NewRecurringRule, RecurringRule } from "@/domain/types";

export function useRecurring(activeOnly?: boolean) {
  const repos = useRepositories();
  const queryClient = useQueryClient();

  const rulesQuery = useQuery({
    queryKey: ["recurring-rules", activeOnly],
    queryFn: () => repos.recurring.list(activeOnly),
  });

  const createRuleMutation = useMutation({
    mutationFn: (input: NewRecurringRule) => repos.recurring.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-rules"] });
    },
  });

  const updateRuleMutation = useMutation({
    mutationFn: ({ id, patch }: { id: ID; patch: Partial<NewRecurringRule> }) =>
      repos.recurring.update(id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-rules"] });
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: (id: ID) => repos.recurring.softDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-rules"] });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (rule: RecurringRule) =>
      repos.recurring.update(rule.id, { active: !rule.active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-rules"] });
    },
  });

  return {
    rules: rulesQuery.data ?? [],
    isLoading: rulesQuery.isLoading,
    createRule: createRuleMutation.mutateAsync,
    updateRule: updateRuleMutation.mutateAsync,
    deleteRule: deleteRuleMutation.mutateAsync,
    toggleActive: toggleActiveMutation.mutateAsync,
  };
}

