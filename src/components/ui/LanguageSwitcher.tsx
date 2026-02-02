import { useTranslation, type Locale } from '@/lib/i18n';

interface LanguageSwitcherProps {
  variant?: 'pill' | 'minimal' | 'dropdown';
  className?: string;
}

const localeNames: Record<Locale, string> = {
  ca: 'Català',
  gl: 'Galego',
};

const localeFlags: Record<Locale, string> = {
  ca: '🏴󠁥󠁳󠁣󠁴󠁿',
  gl: '🇬🇱',
};

export function LanguageSwitcher({ variant = 'pill', className = '' }: LanguageSwitcherProps) {
  const { locale, setLocale } = useTranslation();

  const toggleLocale = () => {
    setLocale(locale === 'ca' ? 'gl' : 'ca');
  };

  if (variant === 'minimal') {
    return (
      <button
        type="button"
        onClick={toggleLocale}
        className={`
          flex items-center gap-1.5 px-2 py-1
          text-sm font-medium text-[var(--color-ink-muted)]
          hover:text-[var(--color-ink)]
          transition-colors
          ${className}
        `}
        title={`Canviar a ${localeNames[locale === 'ca' ? 'gl' : 'ca']}`}
      >
        <span className="text-base">{localeFlags[locale]}</span>
        <span className="uppercase text-xs tracking-wider">{locale}</span>
      </button>
    );
  }

  if (variant === 'dropdown') {
    return (
      <div className={`relative group ${className}`}>
        <button
          type="button"
          className="
            flex items-center gap-2 px-3 py-2
            text-sm font-medium text-[var(--color-ink)]
            hover:text-[var(--color-terracotta)]
            transition-colors
          "
        >
          <span className="text-base">{localeFlags[locale]}</span>
          <span>{localeNames[locale]}</span>
          <svg
            className="w-4 h-4 text-[var(--color-ink-muted)] group-hover:text-current transition-colors"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div className="
          absolute top-full right-0 mt-1
          opacity-0 invisible group-hover:opacity-100 group-hover:visible
          transition-all duration-200
          bg-[var(--color-cream)] border-2 border-[var(--color-terracotta)]/20
          rounded-xl shadow-lg overflow-hidden
          min-w-[140px]
        ">
          {(Object.keys(localeNames) as Locale[]).map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => setLocale(loc)}
              className={`
                w-full flex items-center gap-2 px-4 py-2.5
                text-sm font-medium text-left
                transition-colors
                ${locale === loc
                  ? 'bg-[var(--color-sun)]/10 text-[var(--color-sun-dark)]'
                  : 'text-[var(--color-ink)] hover:bg-[var(--color-sand)]'
                }
              `}
            >
              <span className="text-base">{localeFlags[loc]}</span>
              <span>{localeNames[loc]}</span>
              {locale === loc && (
                <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Default: pill variant - toggle button with both options
  return (
    <div className={`
      inline-flex items-center
      bg-[var(--color-sand)] border-2 border-[var(--color-terracotta)]/20
      rounded-full p-1
      ${className}
    `}>
      {(Object.keys(localeNames) as Locale[]).map((loc) => (
        <button
          key={loc}
          type="button"
          onClick={() => setLocale(loc)}
          className={`
            flex items-center gap-1.5 px-3 py-1.5
            text-sm font-medium
            rounded-full
            transition-all duration-200
            ${locale === loc
              ? 'bg-[var(--color-cream)] text-[var(--color-ink)] shadow-sm'
              : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
            }
          `}
        >
          <span className="text-sm">{localeFlags[loc]}</span>
          <span>{localeNames[loc]}</span>
        </button>
      ))}
    </div>
  );
}
