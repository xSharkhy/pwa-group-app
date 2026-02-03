import { useEffect, useState } from 'react';
import { I18nProvider, getLocaleFromBrowser } from '@/lib/i18n';
import { ToastProvider } from '@/components/ui/Toast';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { useAuthStore } from '@/stores/auth';
import { LoginForm, ProfileSetupForm } from '@/components/auth';
import { GroupList, GroupCreateForm, GroupJoinForm } from '@/components/groups';
import { Modal, Avatar } from '@/components/ui';

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-sand)]">
      {/* Animated sun loader */}
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full bg-[var(--color-sun)] animate-pulse" />
        <div className="absolute inset-2 rounded-full bg-[var(--color-sun-light)] animate-pulse" style={{ animationDelay: '150ms' }} />
        <div className="absolute inset-4 rounded-full bg-[var(--color-cream)]" />
      </div>
      <p
        className="mt-4 text-[var(--color-ink-muted)] text-sm animate-pulse"
        style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic' }}
      >
        Carregant...
      </p>
    </div>
  );
}

function AppContent() {
  const { session, profile, loading, initialized } = useAuthStore();
  const [view, setView] = useState<'list' | 'create' | 'join'>('list');

  // Show loading state
  if (!initialized || loading) {
    return <LoadingSpinner />;
  }

  // Show login if not authenticated
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[var(--color-sand)]">
        <LoginForm />
      </div>
    );
  }

  // Show profile setup if profile is incomplete
  if (!profile || !profile.display_name) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[var(--color-sand)]">
        <ProfileSetupForm onComplete={() => {
          // Reload to refresh profile state
          window.location.href = '/';
        }} />
      </div>
    );
  }

  // Main app view
  return (
    <div className="min-h-screen bg-[var(--color-sand)]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[var(--color-cream)]/95 backdrop-blur-sm border-b-2 border-[var(--color-terracotta)]/20">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo/Sun icon */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-sun)] to-[var(--color-sun-dark)] flex items-center justify-center shadow-md">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h1
              className="font-bold text-xl text-[var(--color-ink)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Grup d'Amics
            </h1>
          </div>

          <a
            href="/profile"
            className="group flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <Avatar
              src={profile.avatar_url}
              name={profile.display_name}
              size="md"
            />
          </a>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <GroupList
          onCreateClick={() => setView('create')}
          onJoinClick={() => setView('join')}
        />
      </main>

      {/* Create Group Modal */}
      <Modal
        isOpen={view === 'create'}
        onClose={() => setView('list')}
        title="Crear un nou grup"
        size="md"
      >
        <GroupCreateForm
          onSuccess={(groupId) => {
            window.location.href = `/groups/${groupId}`;
          }}
          onCancel={() => setView('list')}
        />
      </Modal>

      {/* Join Group Modal */}
      <Modal
        isOpen={view === 'join'}
        onClose={() => setView('list')}
        title="Unir-se a un grup"
        size="md"
      >
        <GroupJoinForm
          onSuccess={(groupId) => {
            window.location.href = `/groups/${groupId}`;
          }}
          onCancel={() => setView('list')}
        />
      </Modal>
    </div>
  );
}

export function App() {
  const [locale, setLocale] = useState<'ca' | 'gl'>('ca');

  useEffect(() => {
    // Get locale from localStorage or browser
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
          <AppContent />
        </AuthProvider>
      </ToastProvider>
    </I18nProvider>
  );
}
