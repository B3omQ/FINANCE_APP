import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRepositories } from "@/app/providers";
import type { CategoryKind, ID, NewCategory } from "@/domain/types";

export function useCategories(kind?: CategoryKind) {
  const repos = useRepositories();
  const queryClient = useQueryClient();

  const categoriesQuery = useQuery({
    queryKey: ["categories", kind],
    queryFn: () => repos.categories.list(kind),
  });

  const createCategoryMutation = useMutation({
    mutationFn: (input: NewCategory) => repos.categories.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, patch }: { id: ID; patch: Partial<NewCategory> }) =>
      repos.categories.update(id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: ID) => repos.categories.softDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  return {
    categories: categoriesQuery.data ?? [],
    isLoading: categoriesQuery.isLoading,
    createCategory: createCategoryMutation.mutateAsync,
    updateCategory: updateCategoryMutation.mutateAsync,
    deleteCategory: deleteCategoryMutation.mutateAsync,
  };
}
