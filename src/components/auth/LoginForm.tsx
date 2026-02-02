import { useState, useEffect } from 'react';
import { Button, Input, Card, LanguageSwitcher } from '@/components/ui';
import { useTranslation } from '@/lib/i18n';
import {
  signInWithGoogle,
  signInWithSpotify,
  signInWithMagicLink,
} from '@/lib/auth';

const ERROR_MESSAGES: Record<string, Record<string, string>> = {
  otp_expired: {
    ca: "L'enllaç ha expirat. Torna a sol·licitar-ne un de nou.",
    gl: "O enlace expirou. Volve solicitar un novo.",
  },
  access_denied: {
    ca: "Accés denegat. Torna-ho a provar.",
    gl: "Acceso denegado. Volve tentalo.",
  },
  auth_failed: {
    ca: "Error d'autenticació. Torna-ho a provar.",
    gl: "Erro de autenticación. Volve tentalo.",
  },
  rate_limit: {
    ca: "Massa intents. Espera un minut i torna-ho a provar.",
    gl: "Demasiados intentos. Agarda un minuto e volve tentalo.",
  },
};

export function LoginForm() {
  const { t, locale } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for error in URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorCode = params.get('error');

    if (errorCode) {
      const errorMsg = ERROR_MESSAGES[errorCode]?.[locale] ||
        ERROR_MESSAGES[errorCode]?.ca ||
        decodeURIComponent(params.get('message') || '') ||
        t('errors.generic');
      setError(errorMsg);

      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [locale, t]);

  const handleGoogleLogin = async () => {
    try {
      setLoading('google');
      setError(null);
      await signInWithGoogle();
    } catch (err) {
      setError(t('errors.generic'));
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  const handleSpotifyLogin = async () => {
    try {
      setLoading('spotify');
      setError(null);
      await signInWithSpotify();
    } catch (err) {
      setError(t('errors.generic'));
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      setLoading('email');
      setError(null);
      await signInWithMagicLink(email);
      setMagicLinkSent(true);
    } catch (err: unknown) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : '';

      if (errorMessage.includes('rate limit')) {
        setError(ERROR_MESSAGES.rate_limit[locale] || ERROR_MESSAGES.rate_limit.ca);
      } else {
        setError(t('errors.generic'));
      }
    } finally {
      setLoading(null);
    }
  };

  if (magicLinkSent) {
    return (
      <Card variant="elevated" className="w-full max-w-sm mx-auto text-center">
        {/* Success illustration */}
        <div className="relative mb-6">
          <div className="mx-auto w-20 h-20 bg-[var(--color-success)]/20 rounded-2xl flex items-center justify-center">
            <svg
              className="w-10 h-10 text-[var(--color-success)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          {/* Decorative sparkles */}
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--color-sun)] rounded-full animate-pulse" />
          <div className="absolute -bottom-2 left-4 w-3 h-3 bg-[var(--color-sea)] rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
        </div>

        <h2
          className="text-xl font-semibold text-[var(--color-ink)] mb-2"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {t('auth.login.magicLinkSent')}
        </h2>
        <p className="text-[var(--color-ink-muted)] mb-2">
          {t('auth.login.checkEmail')}
        </p>
        <p
          className="text-[var(--color-ink)] font-medium"
          style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic' }}
        >
          {email}
        </p>
        <button
          onClick={() => setMagicLinkSent(false)}
          className="
            mt-6 text-[var(--color-sea)] hover:text-[var(--color-sea-dark)]
            text-sm font-medium
            transition-colors
          "
        >
          ← {t('common.back')}
        </button>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Header with decorative elements */}
      <div className="text-center mb-8 relative">
        {/* Decorative sun */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-24 h-24 bg-[var(--color-sun)]/20 rounded-full blur-2xl" />

        {/* Logo */}
        <div className="relative inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[var(--color-sun)] to-[var(--color-sun-dark)] rounded-2xl shadow-lg shadow-[var(--color-sun)]/30 mb-4">
          <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>

        <h1
          className="text-3xl font-bold text-[var(--color-ink)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {t('auth.login.title')}
        </h1>
        <p
          className="text-[var(--color-ink-muted)] mt-2"
          style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic' }}
        >
          {t('auth.login.subtitle')}
        </p>
      </div>

      <Card variant="elevated" padding="lg">
        {error && (
          <div className="mb-4 p-3 bg-[var(--color-error)]/10 border-2 border-[var(--color-error)]/30 rounded-xl text-[var(--color-error)] text-sm flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        <div className="space-y-3">
          {/* Google */}
          <Button
            type="button"
            variant="secondary"
            className="w-full justify-center"
            onClick={handleGoogleLogin}
            loading={loading === 'google'}
            disabled={loading !== null}
            icon={
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            }
          >
            {t('auth.login.google')}
          </Button>

          {/* Spotify */}
          <Button
            type="button"
            variant="secondary"
            className="w-full justify-center"
            onClick={handleSpotifyLogin}
            loading={loading === 'spotify'}
            disabled={loading !== null}
            icon={
              <svg className="w-5 h-5 text-[#1DB954]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
              </svg>
            }
          >
            {t('auth.login.spotify')}
          </Button>

          {/* Divider */}
          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-[var(--color-terracotta)]/20" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span
                className="px-4 bg-[var(--color-cream)] text-[var(--color-ink-muted)]"
                style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic' }}
              >
                {t('auth.login.or')}
              </span>
            </div>
          </div>

          {/* Magic Link */}
          <form onSubmit={handleMagicLink} className="space-y-3">
            <Input
              type="email"
              placeholder={t('auth.login.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              }
            />
            <Button
              type="submit"
              variant="sun"
              className="w-full"
              loading={loading === 'email'}
              disabled={loading !== null || !email}
            >
              {t('auth.login.sendMagicLink')}
            </Button>
          </form>
        </div>
      </Card>

      {/* Language Switcher */}
      <div className="flex justify-center mt-6">
        <LanguageSwitcher variant="pill" />
      </div>
    </div>
  );
}
