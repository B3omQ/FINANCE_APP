import React, { createContext, useContext, useMemo } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Temporary repository context until Phase 1 data layer is implemented
export interface AppRepositories {
  isReady: boolean;
}

const RepositoriesContext = createContext<AppRepositories | null>(null);

export function useRepositories(): AppRepositories {
  const context = useContext(RepositoriesContext);
  if (!context) {
    throw new Error("useRepositories must be used within RepositoriesProvider");
  }
  return context;
}

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
    []
  );

  const repos = useMemo<AppRepositories>(
    () => ({
      isReady: true,
    }),
    []
  );

  return (
    <QueryClientProvider client={queryClient}>
      <RepositoriesContext.Provider value={repos}>
        {children}
      </RepositoriesContext.Provider>
    </QueryClientProvider>
  );
}
