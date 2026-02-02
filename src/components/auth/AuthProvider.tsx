import { useEffect, type ReactNode } from 'react';
import { useAuthStore } from '@/stores/auth';
import { supabase } from '@/lib/supabase';
import { getProfile } from '@/lib/auth';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const {
    setSession,
    setUser,
    setProfile,
    setLoading,
    setInitialized,
    reset,
  } = useAuthStore();

  useEffect(() => {
    let mounted = true;

    // Listen for auth changes FIRST - this catches the SIGNED_IN event from magic link
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log('Auth state changed:', event, session?.user?.email);

      setSession(session);
      setUser(session?.user ?? null);

      if (event === 'SIGNED_OUT') {
        reset();
        setInitialized(true);
        return;
      }

      if (session?.user) {
        try {
          const profile = await getProfile(session.user.id);
          if (mounted) setProfile(profile);
        } catch (err) {
          console.log('Profile not found (new user):', err);
          if (mounted) setProfile(null);
        }
      }

      if (mounted) {
        setLoading(false);
        setInitialized(true);
      }
    });

    // Then get initial session (for page refresh scenarios)
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (!mounted) return;

      if (error) {
        console.error('Get session error:', error);
        setLoading(false);
        setInitialized(true);
        return;
      }

      // Only update if onAuthStateChange hasn't already set initialized
      const currentState = useAuthStore.getState();
      if (!currentState.initialized) {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          try {
            const profile = await getProfile(session.user.id);
            if (mounted) setProfile(profile);
          } catch {
            if (mounted) setProfile(null);
          }
        }

        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setSession, setUser, setProfile, setLoading, setInitialized, reset]);

  return <>{children}</>;
}
