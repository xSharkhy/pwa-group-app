import { type InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, className = '', id, ...props }, ref) => {
    const inputId = id || props.name || Math.random().toString(36).slice(2);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-[var(--color-ink)] mb-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-ink-muted)]">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`
              w-full px-4 py-3
              ${icon ? 'pl-12' : ''}
              bg-[var(--color-cream)]
              border-2 rounded-xl
              text-[var(--color-ink)]
              placeholder:text-[var(--color-ink-muted)]
              transition-all duration-200 ease-out
              focus:outline-none focus:border-[var(--color-sun)] focus:ring-4 focus:ring-[var(--color-sun-light)]/30
              hover:border-[var(--color-terracotta)]
              disabled:bg-[var(--color-sand-dark)] disabled:text-[var(--color-ink-muted)] disabled:cursor-not-allowed
              ${error
                ? 'border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[var(--color-error)]/20'
                : 'border-[var(--color-terracotta)]/50'
              }
              ${className}
            `}
            {...props}
          />
        </div>
        {hint && !error && (
          <p className="mt-2 text-sm text-[var(--color-ink-muted)]">{hint}</p>
        )}
        {error && (
          <p className="mt-2 text-sm text-[var(--color-error)] flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
