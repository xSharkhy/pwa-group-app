import { type HTMLAttributes, type ReactNode } from 'react';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'sun' | 'sea' | 'success' | 'warning' | 'error' | 'muted';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  dot?: boolean;
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  icon,
  dot,
  className = '',
  ...props
}: BadgeProps) {
  const variants = {
    default: `
      bg-[var(--color-terracotta)]/20
      text-[var(--color-ink)]
      border border-[var(--color-terracotta)]/30
    `,
    sun: `
      bg-[var(--color-sun)]/20
      text-[var(--color-sun-dark)]
      border border-[var(--color-sun)]/30
    `,
    sea: `
      bg-[var(--color-sea)]/20
      text-[var(--color-sea-dark)]
      border border-[var(--color-sea)]/30
    `,
    success: `
      bg-[var(--color-success)]/20
      text-[var(--color-success)]
      border border-[var(--color-success)]/30
    `,
    warning: `
      bg-[var(--color-warning)]/20
      text-[var(--color-sun-dark)]
      border border-[var(--color-warning)]/30
    `,
    error: `
      bg-[var(--color-error)]/20
      text-[var(--color-error)]
      border border-[var(--color-error)]/30
    `,
    muted: `
      bg-[var(--color-sand-dark)]
      text-[var(--color-ink-muted)]
      border border-[var(--color-terracotta)]/20
    `,
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  const dotColors = {
    default: 'bg-[var(--color-terracotta)]',
    sun: 'bg-[var(--color-sun)]',
    sea: 'bg-[var(--color-sea)]',
    success: 'bg-[var(--color-success)]',
    warning: 'bg-[var(--color-warning)]',
    error: 'bg-[var(--color-error)]',
    muted: 'bg-[var(--color-ink-muted)]',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        font-medium
        rounded-full
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      {...props}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]} animate-pulse`} />
      )}
      {icon && <span className="w-4 h-4 flex-shrink-0">{icon}</span>}
      {children}
    </span>
  );
}

// Achievement badge - for gamification
interface AchievementBadgeProps {
  icon: ReactNode;
  name: string;
  description?: string;
  earned?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function AchievementBadge({
  icon,
  name,
  description,
  earned = false,
  size = 'md',
}: AchievementBadgeProps) {
  const sizes = {
    sm: {
      container: 'w-12 h-12',
      icon: 'w-6 h-6',
      text: 'text-xs',
    },
    md: {
      container: 'w-16 h-16',
      icon: 'w-8 h-8',
      text: 'text-sm',
    },
    lg: {
      container: 'w-20 h-20',
      icon: 'w-10 h-10',
      text: 'text-base',
    },
  };

  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div
        className={`
          ${sizes[size].container}
          rounded-2xl
          flex items-center justify-center
          transition-all duration-300
          ${earned
            ? 'bg-gradient-to-br from-[var(--color-sun)] to-[var(--color-sun-dark)] shadow-lg shadow-[var(--color-sun)]/30'
            : 'bg-[var(--color-sand-dark)] opacity-50 grayscale'
          }
        `}
      >
        <span className={`${sizes[size].icon} text-white`}>{icon}</span>
      </div>
      <div>
        <p
          className={`
            ${sizes[size].text}
            font-semibold
            ${earned ? 'text-[var(--color-ink)]' : 'text-[var(--color-ink-muted)]'}
          `}
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {name}
        </p>
        {description && (
          <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
