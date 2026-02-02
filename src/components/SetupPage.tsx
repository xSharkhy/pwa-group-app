import { useEffect, useState } from 'react';
import { I18nProvider, getLocaleFromBrowser } from '@/lib/i18n';
import { ToastProvider } from '@/components/ui/Toast';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { ProfileSetupForm } from '@/components/auth';
import { useAuthStore } from '@/stores/auth';

function SetupContent() {
  const { session, loading, initialized } = useAuthStore();

  if (!initialized || loading) {
    return (
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
    );
  }

  if (!session) {
    // Not logged in, redirect to home
    window.location.href = '/';
    return null;
  }

  return (
    <ProfileSetupForm
      onComplete={() => {
        window.location.href = '/';
      }}
    />
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
