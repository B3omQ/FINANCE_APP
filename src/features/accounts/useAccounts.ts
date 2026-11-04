import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRepositories } from "@/app/providers";
import type { ID, Money, NewAccount, NewTransfer } from "@/domain/types";

export function useAccounts(opts?: { includeArchived?: boolean }) {
  const repos = useRepositories();
  const queryClient = useQueryClient();

  const accountsQuery = useQuery({
    queryKey: ["accounts", opts?.includeArchived],
    queryFn: () => repos.accounts.list(opts),
  });

  const balancesQuery = useQuery({
    queryKey: ["account-balances"],
    queryFn: () => repos.accounts.balances(),
  });

  const createAccountMutation = useMutation({
    mutationFn: (input: NewAccount) => repos.accounts.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["account-balances"] });
    },
  });

  const updateAccountMutation = useMutation({
    mutationFn: ({ id, patch }: { id: ID; patch: Partial<NewAccount> }) =>
      repos.accounts.update(id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["account-balances"] });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: (id: ID) => repos.accounts.softDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["account-balances"] });
    },
  });

  const transferMutation = useMutation({
    mutationFn: (input: NewTransfer) => repos.transactions.createTransfer(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["account-balances"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });

  return {
    accounts: accountsQuery.data ?? [],
    balances: balancesQuery.data ?? ({} as Record<ID, Money>),
    isLoading: accountsQuery.isLoading || balancesQuery.isLoading,
    createAccount: createAccountMutation.mutateAsync,
    updateAccount: updateAccountMutation.mutateAsync,
    deleteAccount: deleteAccountMutation.mutateAsync,
    transferFunds: transferMutation.mutateAsync,
  };
}
