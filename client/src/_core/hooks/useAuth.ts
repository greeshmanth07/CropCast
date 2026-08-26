import { trpc } from "@/lib/trpc";

export function useAuth() {
  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const logoutMutation = trpc.auth.logout.useMutation();

  return {
    user: meQuery.data,
    loading: meQuery.isLoading,
    error: meQuery.error,
    isAuthenticated: !!meQuery.data,
    logout: logoutMutation.mutate,
    logoutAsync: logoutMutation.mutateAsync,
  };
}
