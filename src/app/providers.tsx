import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Repositories } from "@/data";
import { getRepositories } from "@/data";

const RepositoriesContext = createContext<Repositories | null>(null);

export function useRepositories(): Repositories {
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
  const [repositories, setRepositories] = useState<Repositories | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getRepositories()
      .then((repos) => {
        if (isMounted) {
          setRepositories(repos);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to initialize repositories:", err);
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

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

  if (isLoading || !repositories) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <RepositoriesContext.Provider value={repositories}>
        {children}
      </RepositoriesContext.Provider>
    </QueryClientProvider>
  );
}
