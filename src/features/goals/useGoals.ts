import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRepositories } from "@/app/providers";
import type { ID, Money, NewGoal } from "@/domain/types";

export function useGoals() {
  const repos = useRepositories();
  const queryClient = useQueryClient();

  const goalsQuery = useQuery({
    queryKey: ["goals"],
    queryFn: () => repos.goals.list(),
  });

  const createGoalMutation = useMutation({
    mutationFn: (input: NewGoal) => repos.goals.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });

  const updateGoalMutation = useMutation({
    mutationFn: ({ id, patch }: { id: ID; patch: Partial<NewGoal> }) =>
      repos.goals.update(id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: (id: ID) => repos.goals.softDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });

  const addSavingMutation = useMutation({
    mutationFn: ({ id, amount }: { id: ID; amount: Money }) =>
      repos.goals.addSaving(id, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });

  return {
    goals: goalsQuery.data ?? [],
    isLoading: goalsQuery.isLoading,
    createGoal: createGoalMutation.mutateAsync,
    updateGoal: updateGoalMutation.mutateAsync,
    deleteGoal: deleteGoalMutation.mutateAsync,
    addSaving: addSavingMutation.mutateAsync,
  };
}
