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

    async function initializeAuth() {
      try {
        // Get initial session with timeout
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Session timeout')), 10000)
        );

        const sessionPromise = supabase.auth.getSession();
        const { data: { session }, error: sessionError } = await Promise.race([
          sessionPromise,
          timeoutPromise,
        ]) as Awaited<typeof sessionPromise>;

        if (!mounted) return;

        if (sessionError) {
          console.error('Session error:', sessionError);
          setLoading(false);
          setInitialized(true);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          try {
            const profile = await getProfile(session.user.id);
            if (mounted) setProfile(profile);
          } catch (profileError) {
            console.log('Profile fetch failed (might be new user):', profileError);
            if (mounted) setProfile(null);
          }
        }

        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    }

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log('Auth state changed:', event);
      setSession(session);
      setUser(session?.user ?? null);

      if (event === 'SIGNED_OUT') {
        reset();
        return;
      }

      if (session?.user) {
        try {
          const profile = await getProfile(session.user.id);
          if (mounted) setProfile(profile);
        } catch {
          if (mounted) setProfile(null);
        }
      }

      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setSession, setUser, setProfile, setLoading, setInitialized, reset]);

  return <>{children}</>;
}
