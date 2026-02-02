import { useEffect, useState } from 'react';
import { I18nProvider, getLocaleFromBrowser } from '@/lib/i18n';
import { ToastProvider } from '@/components/ui/Toast';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { useAuthStore } from '@/stores/auth';
import { supabase } from '@/lib/supabase';
import { EmailWhitelist } from '@/components/admin';
import { Button, Card } from '@/components/ui';

function AdminContent() {
  const { session, profile, loading } = useAuthStore();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkAdmin() {
      if (!profile) {
        setChecking(false);
        return;
      }

      // Check if current user is the first registered user
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      setIsAdmin(data?.id === profile.id);
      setChecking(false);
    }

    if (profile) {
      checkAdmin();
    } else if (!loading) {
      setChecking(false);
    }
  }, [profile, loading]);

  if (loading || checking) {
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

  if (!session || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-sand)] p-4">
        <Card variant="elevated" padding="lg" className="text-center max-w-sm">
          <div className="w-16 h-16 bg-[var(--color-error)]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[var(--color-error)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-[var(--color-ink)] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            Accés restringit
          </h2>
          <p className="text-[var(--color-ink-muted)] mb-4">
            Has d'iniciar sessió per accedir a l'admin.
          </p>
          <Button variant="sun" onClick={() => window.location.href = '/'}>
            Anar a login
          </Button>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-sand)] p-4">
        <Card variant="elevated" padding="lg" className="text-center max-w-sm">
          <div className="w-16 h-16 bg-[var(--color-warning)]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[var(--color-warning)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-[var(--color-ink)] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            No tens permisos
          </h2>
          <p className="text-[var(--color-ink-muted)] mb-4">
            Només l'administrador pot accedir a aquesta pàgina.
          </p>
          <Button variant="secondary" onClick={() => window.location.href = '/'}>
            Tornar a l'app
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-sand)]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[var(--color-cream)]/95 backdrop-blur-sm border-b-2 border-[var(--color-terracotta)]/20">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-3">
          <a
            href="/"
            className="p-2 -ml-2 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-sand-dark)] rounded-xl transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </a>
          <h1
            className="font-semibold text-[var(--color-ink)] text-lg"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Administració
          </h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <EmailWhitelist />
      </main>
    </div>
  );
}

export function AdminPage() {
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
          <AdminContent />
        </AuthProvider>
      </ToastProvider>
    </I18nProvider>
  );
}
