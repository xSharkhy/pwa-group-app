import { useEffect, useState } from 'react';
import { I18nProvider, getLocaleFromBrowser } from '@/lib/i18n';
import { ToastProvider } from '@/components/ui/Toast';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { LoginForm } from '@/components/auth';
import { GroupJoinForm } from '@/components/groups';
import { useAuthStore } from '@/stores/auth';

interface JoinPageProps {
  code: string;
}

function JoinContent({ code }: JoinPageProps) {
  const { session, profile, loading, initialized } = useAuthStore();

  if (!initialized || loading) {
    return (
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
    );
  }

  // If not logged in, show login first
  if (!session) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            Entra primer per unir-te al grup
          </p>
        </div>
        <LoginForm />
      </div>
    );
  }

  // If logged in but needs setup, redirect
  if (!profile || !profile.display_name) {
    // Store the code so we can redirect back after setup
    sessionStorage.setItem('pendingJoinCode', code);
    window.location.href = '/setup';
    return null;
  }

  // Show join form
  return (
    <GroupJoinForm
      initialCode={code}
      onSuccess={(groupId) => {
        window.location.href = `/groups/${groupId}`;
      }}
      onCancel={() => {
        window.location.href = '/';
      }}
    />
  );
}

export function JoinPage({ code }: JoinPageProps) {
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
          <JoinContent code={code} />
        </AuthProvider>
      </ToastProvider>
    </I18nProvider>
  );
}
