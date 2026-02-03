import { useEffect, useRef, type ReactNode } from 'react';
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

  // Use ref to track if we've already initialized
  const hasInitialized = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    // Prevent double initialization (React StrictMode)
    if (hasInitialized.current) {
      return;
    }
    hasInitialized.current = true;

    async function loadProfile(userId: string) {
      try {
        const profile = await getProfile(userId);
        if (mountedRef.current) {
          setProfile(profile);
        }
      } catch (err) {
        console.log('Profile not found or error:', err);
        if (mountedRef.current) {
          setProfile(null);
        }
      }
    }

    // Single initialization function
    async function initialize() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (!mountedRef.current) return;

        if (error) {
          console.error('Auth getSession error:', error);
          setLoading(false);
          setInitialized(true);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await loadProfile(session.user.id);
        }

        if (mountedRef.current) {
          setLoading(false);
          setInitialized(true);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        if (mountedRef.current) {
          setLoading(false);
          setInitialized(true);
        }
      }
    }

    // Start initialization
    initialize();

    // Listen for auth changes AFTER initial load
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mountedRef.current) return;

        console.log('Auth event:', event);

        // Update session/user immediately
        setSession(session);
        setUser(session?.user ?? null);

        if (event === 'SIGNED_OUT') {
          reset();
          return;
        }

        // For sign in events, load profile
        if (event === 'SIGNED_IN' && session?.user) {
          await loadProfile(session.user.id);
          if (mountedRef.current) {
            setLoading(false);
            setInitialized(true);
          }
        }

        // For token refresh, just update session (profile already loaded)
        if (event === 'TOKEN_REFRESHED') {
          setLoading(false);
        }
      }
    );

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [setSession, setUser, setProfile, setLoading, setInitialized, reset]);

  return <>{children}</>;
}
