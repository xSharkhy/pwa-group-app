import { type ReactNode } from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'sun' | 'sea';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6">
      {/* Decorative elements */}
      <div className="relative mb-6">
        <div className="absolute -top-4 -left-4 w-16 h-16 bg-[var(--color-sun)]/20 rounded-full blur-xl" />
        <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-[var(--color-sea)]/20 rounded-full blur-xl" />

        {icon ? (
          <div className="relative w-20 h-20 bg-[var(--color-sand-dark)] rounded-2xl flex items-center justify-center text-[var(--color-ink-muted)]">
            {icon}
          </div>
        ) : (
          <div className="relative w-20 h-20 bg-[var(--color-sand-dark)] rounded-2xl flex items-center justify-center">
            <svg
              className="w-10 h-10 text-[var(--color-ink-muted)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Title */}
      <h3
        className="text-xl font-semibold text-[var(--color-ink)] mb-2"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="text-[var(--color-ink-muted)] max-w-sm mb-6">
          {description}
        </p>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3">
          {action && (
            <Button
              variant={action.variant || 'sun'}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="ghost"
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Specific empty states for the app
export function EmptyGroups({ onCreate }: { onCreate: () => void }) {
  return (
    <EmptyState
      icon={
        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
      }
      title="Encara no tens cap grup"
      description="Crea un grup nou o uneix-te a un existent amb un codi d'invitació."
      action={{
        label: "Crear grup",
        onClick: onCreate,
        variant: 'sun',
      }}
    />
  );
}

export function EmptyPlaces({ onAdd }: { onAdd: () => void }) {
  return (
    <EmptyState
      icon={
        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
      }
      title="Cap lloc afegit"
      description="Afegeix llocs al mapa per recordar on heu anat o on voleu anar!"
      action={{
        label: "Afegir lloc",
        onClick: onAdd,
        variant: 'sea',
      }}
    />
  );
}

export function EmptyPhotos({ onUpload }: { onUpload: () => void }) {
  return (
    <EmptyState
      icon={
        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
      }
      title="Sense fotos encara"
      description="Puja fotos per guardar els millors moments amb els teus amics."
      action={{
        label: "Pujar fotos",
        onClick: onUpload,
        variant: 'sun',
      }}
    />
  );
}

export function EmptyRecaps() {
  return (
    <EmptyState
      icon={
        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
      }
      title="Cap recap aquesta setmana"
      description="Els recaps es generen automàticament cada divendres amb les fotos i quedades de la setmana."
    />
  );
}
