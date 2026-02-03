import { useEffect, useState } from 'react';
import { I18nProvider, getLocaleFromBrowser } from '@/lib/i18n';
import { ToastProvider } from '@/components/ui/Toast';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { ProfileSetupForm } from '@/components/auth';
import { useAuthStore } from '@/stores/auth';

function SetupContent() {
  const { session, profile, loading, initialized } = useAuthStore();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  // Handle redirect in useEffect, not during render
  useEffect(() => {
    if (initialized && !loading && !session) {
      setShouldRedirect(true);
    }
  }, [initialized, loading, session]);

  useEffect(() => {
    if (shouldRedirect) {
      window.location.href = '/';
    }
  }, [shouldRedirect]);

  // Handle already completed profile
  useEffect(() => {
    if (initialized && !loading && session && profile?.display_name) {
      // Profile already complete, redirect to home
      window.location.href = '/';
    }
  }, [initialized, loading, session, profile?.display_name]);

  if (!initialized || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-sand)]">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full bg-[var(--color-sun)] animate-pulse" />
          <div className="absolute inset-2 rounded-full bg-[var(--color-sun-light)] animate-pulse" style={{ animationDelay: '150ms' }} />
          <div className="absolute inset-4 rounded-full bg-[var(--color-cream)]" />
        </div>
      </div>
    );
  }

  if (!session || shouldRedirect) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-sand)]">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full bg-[var(--color-sun)] animate-pulse" />
          <div className="absolute inset-2 rounded-full bg-[var(--color-sun-light)] animate-pulse" style={{ animationDelay: '150ms' }} />
          <div className="absolute inset-4 rounded-full bg-[var(--color-cream)]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[var(--color-sand)]">
      <ProfileSetupForm
        onComplete={() => {
          window.location.href = '/';
        }}
      />
    </div>
  );
}

export function SetupPage() {
  const [locale, setLocale] = useState<'ca' | 'gl'>('ca');

  useEffect(() => {
    const stored = localStorage.getItem('locale') as 'ca' | 'gl' | null;
    if (stored && (stored === 'ca' || stored === 'gl')) {
      setLocale(stored);
    } else {
      setLocale(getLocaleFromBrowser());
    }
  }, []);

  return (
    <I18nProvider defaultLocale={locale}>
      <ToastProvider>
        <AuthProvider>
          <SetupContent />
        </AuthProvider>
      </ToastProvider>
    </I18nProvider>
  );
}
