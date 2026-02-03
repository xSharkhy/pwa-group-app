import { useEffect, useState } from 'react';
import { I18nProvider, getLocaleFromBrowser, useTranslation } from '@/lib/i18n';
import { ToastProvider } from '@/components/ui/Toast';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { useAuthStore } from '@/stores/auth';
import { signOut, updateProfile } from '@/lib/auth';
import { Button, Input, Card, Avatar, LanguageSwitcher } from '@/components/ui';

function ProfileContent() {
  const { t, locale, setLocale } = useTranslation();
  const { session, profile, loading, initialized } = useAuthStore();
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile?.display_name) {
      setDisplayName(profile.display_name);
    }
  }, [profile?.display_name]);

  const handleSave = async () => {
    if (!session?.user || !displayName.trim()) return;

    try {
      setSaving(true);
      await updateProfile(session.user.id, {
        display_name: displayName.trim(),
        locale_preference: locale,
      });
      localStorage.setItem('locale', locale);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Error saving profile:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      window.location.href = '/';
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

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

  // Handle redirect in useEffect
  useEffect(() => {
    if (initialized && !loading && (!session || !profile)) {
      window.location.href = '/';
    }
  }, [initialized, loading, session, profile]);

  if (!session || !profile) {
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
            {t('profile.title')}
          </h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Avatar Section */}
        <div className="flex flex-col items-center">
          <Avatar
            src={profile.avatar_url}
            name={profile.display_name}
            size="xl"
          />
          <p className="mt-2 text-[var(--color-ink-muted)] text-sm">
            {profile.email}
          </p>
        </div>

        {/* Edit Profile */}
        <Card variant="default" padding="lg">
          <h2
            className="text-lg font-semibold text-[var(--color-ink)] mb-4"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {t('profile.edit')}
          </h2>

          <div className="space-y-4">
            <Input
              label={t('auth.setup.displayName')}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />

            <div>
              <label className="block text-sm font-medium text-[var(--color-ink)] mb-2">
                {t('auth.setup.locale')}
              </label>
              <LanguageSwitcher variant="pill" />
            </div>

            <Button
              variant="sun"
              onClick={handleSave}
              loading={saving}
              disabled={!displayName.trim()}
              className="w-full"
            >
              {saved ? t('common.success') : t('common.save')}
            </Button>
          </div>
        </Card>

        {/* Danger Zone */}
        <Card variant="default" padding="lg">
          <h2
            className="text-lg font-semibold text-[var(--color-ink)] mb-4"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {t('auth.logout')}
          </h2>
          <Button
            variant="secondary"
            onClick={handleLogout}
            className="w-full"
          >
            {t('auth.logout')}
          </Button>
        </Card>
      </main>
    </div>
  );
}

export function ProfilePage() {
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
          <ProfileContent />
        </AuthProvider>
      </ToastProvider>
    </I18nProvider>
  );
}
