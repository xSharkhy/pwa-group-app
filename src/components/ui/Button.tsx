import { type ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'sun' | 'sea';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseStyles = `
      relative inline-flex items-center justify-center gap-2
      font-medium rounded-xl
      transition-all duration-250 ease-out
      focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
      active:scale-[0.98]
    `;

    const variants = {
      primary: `
        bg-[var(--color-sun-dark)] text-white
        hover:bg-[#C85A3E] hover:shadow-lg hover:-translate-y-0.5
        focus-visible:ring-[var(--color-sun)]
        shadow-md
      `,
      secondary: `
        bg-[var(--color-sand-dark)] text-[var(--color-ink)]
        border-2 border-[var(--color-terracotta)]
        hover:bg-[var(--color-cream)] hover:border-[var(--color-sun)] hover:-translate-y-0.5
        focus-visible:ring-[var(--color-terracotta)]
      `,
      ghost: `
        bg-transparent text-[var(--color-ink)]
        hover:bg-[var(--color-sand-dark)]
        focus-visible:ring-[var(--color-ink-muted)]
      `,
      danger: `
        bg-[var(--color-error)] text-white
        hover:bg-[#C42F3C] hover:shadow-lg hover:-translate-y-0.5
        focus-visible:ring-[var(--color-error)]
        shadow-md
      `,
      sun: `
        bg-gradient-to-br from-[var(--color-sun)] to-[var(--color-sun-dark)]
        text-white
        hover:shadow-[var(--shadow-glow)] hover:-translate-y-0.5
        focus-visible:ring-[var(--color-sun)]
        shadow-md
      `,
      sea: `
        bg-gradient-to-br from-[var(--color-sea)] to-[var(--color-sea-dark)]
        text-white
        hover:shadow-lg hover:-translate-y-0.5
        focus-visible:ring-[var(--color-sea)]
        shadow-md
      `,
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-5 py-2.5 text-base',
      lg: 'px-7 py-3.5 text-lg',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {loading ? (
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : icon ? (
          <span className="w-5 h-5">{icon}</span>
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
