import { useEffect, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}: ModalProps) {
  const handleEscape = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-4xl',
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop with warm overlay */}
      <div
        className="fixed inset-0 bg-[var(--color-ink)]/60 backdrop-blur-sm transition-opacity animate-fade-in-up"
        style={{ animationDuration: '200ms' }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal container */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className={`
            relative w-full ${sizes[size]}
            bg-[var(--color-cream)]
            rounded-2xl
            shadow-xl
            border-2 border-[var(--color-terracotta)]/30
            transform transition-all
            animate-scale-in
          `}
          style={{ animationDuration: '300ms' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Decorative corner accent */}
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-[var(--color-sun)] rounded-full opacity-60" />
          <div className="absolute -bottom-1 -left-1 w-6 h-6 bg-[var(--color-sea)] rounded-full opacity-40" />

          {/* Header */}
          {title && (
            <div className="flex items-center justify-between px-6 py-4 border-b-2 border-[var(--color-terracotta)]/20">
              <h2
                id="modal-title"
                className="text-xl font-semibold text-[var(--color-ink)]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="
                  p-2 rounded-xl
                  text-[var(--color-ink-muted)]
                  hover:text-[var(--color-ink)]
                  hover:bg-[var(--color-sand-dark)]
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-sun)]
                  transition-all duration-200
                "
              >
                <span className="sr-only">Tancar</span>
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          )}

          {/* Close button when no title */}
          {!title && (
            <button
              type="button"
              onClick={onClose}
              className="
                absolute top-4 right-4 z-10
                p-2 rounded-xl
                text-[var(--color-ink-muted)]
                hover:text-[var(--color-ink)]
                hover:bg-[var(--color-sand-dark)]
                focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-sun)]
                transition-all duration-200
              "
            >
              <span className="sr-only">Tancar</span>
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}

          {/* Content */}
          <div className="px-6 py-5">{children}</div>
        </div>
      </div>
    </div>,
    document.body
  );
}
