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
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        getProfile(session.user.id)
          .then(setProfile)
          .catch(() => setProfile(null))
          .finally(() => {
            setLoading(false);
            setInitialized(true);
          });
      } else {
        setLoading(false);
        setInitialized(true);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (event === 'SIGNED_OUT') {
        reset();
        return;
      }

      if (session?.user) {
        try {
          const profile = await getProfile(session.user.id);
          setProfile(profile);
        } catch {
          setProfile(null);
        }
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [setSession, setUser, setProfile, setLoading, setInitialized, reset]);

  return <>{children}</>;
}
