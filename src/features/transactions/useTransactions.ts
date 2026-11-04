import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRepositories } from "@/app/providers";
import type { ID, NewTransaction, NewTransfer } from "@/domain/types";
import type { TransactionFilter } from "@/data/repositories/types";

export function useTransactions(filter?: TransactionFilter) {
  const repos = useRepositories();
  const queryClient = useQueryClient();

  const transactionsQuery = useQuery({
    queryKey: ["transactions", filter],
    queryFn: () => repos.transactions.list(filter),
  });

  const createTransactionMutation = useMutation({
    mutationFn: (input: NewTransaction) => repos.transactions.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["account-balances"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });

  const createTransferMutation = useMutation({
    mutationFn: (input: NewTransfer) => repos.transactions.createTransfer(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["account-balances"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });

  const updateTransactionMutation = useMutation({
    mutationFn: ({ id, patch }: { id: ID; patch: Partial<NewTransaction> }) =>
      repos.transactions.update(id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["account-balances"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: (id: ID) => repos.transactions.softDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["account-balances"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });

  const restoreTransactionMutation = useMutation({
    mutationFn: (id: ID) => repos.transactions.restore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["account-balances"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });

  return {
    transactions: transactionsQuery.data ?? [],
    isLoading: transactionsQuery.isLoading,
    createTransaction: createTransactionMutation.mutateAsync,
    createTransfer: createTransferMutation.mutateAsync,
    updateTransaction: updateTransactionMutation.mutateAsync,
    deleteTransaction: deleteTransactionMutation.mutateAsync,
    restoreTransaction: restoreTransactionMutation.mutateAsync,
  };
}
