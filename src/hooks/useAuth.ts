import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth';
import { supabase } from '@/lib/supabase';
import { getProfile } from '@/lib/auth';

export function useAuth() {
  const {
    session,
    user,
    profile,
    loading,
    initialized,
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
          .catch(console.error)
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

      if (session?.user) {
        try {
          const profile = await getProfile(session.user.id);
          setProfile(profile);
        } catch (error) {
          // Profile might not exist yet for new users
          setProfile(null);
        }
      } else {
        reset();
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

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
