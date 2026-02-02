import { useAuthStore } from '@/stores/auth';

/**
 * Simple hook to access auth state from the store.
 * Auth initialization is handled by AuthProvider - this hook just reads the state.
 */
export function useAuth() {
  const { session, user, profile, loading, initialized } = useAuthStore();

  return {
    session,
    user,
    profile,
    loading,
    initialized,
    isAuthenticated: !!session,
    needsSetup: !!session && !profile?.display_name,
  };
}
