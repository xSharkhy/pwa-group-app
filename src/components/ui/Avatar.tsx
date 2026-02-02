import { type HTMLAttributes } from 'react';

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'away';
}

function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getColorFromName(name?: string): string {
  if (!name) return 'bg-[var(--color-terracotta)]';
  const colors = [
    'bg-[var(--color-sun)]',
    'bg-[var(--color-sun-dark)]',
    'bg-[var(--color-sea)]',
    'bg-[var(--color-sea-dark)]',
    'bg-[var(--color-terracotta)]',
  ];
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

export function Avatar({
  src,
  alt,
  name,
  size = 'md',
  status,
  className = '',
  ...props
}: AvatarProps) {
  const sizes = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-xl',
  };

  const statusSizes = {
    xs: 'w-2 h-2 -bottom-0.5 -right-0.5',
    sm: 'w-2.5 h-2.5 -bottom-0.5 -right-0.5',
    md: 'w-3 h-3 bottom-0 right-0',
    lg: 'w-4 h-4 bottom-0 right-0',
    xl: 'w-5 h-5 bottom-0.5 right-0.5',
  };

  const statusColors = {
    online: 'bg-[var(--color-success)]',
    offline: 'bg-[var(--color-ink-muted)]',
    away: 'bg-[var(--color-warning)]',
  };

  return (
    <div className={`relative inline-flex ${className}`} {...props}>
      {src ? (
        <img
          src={src}
          alt={alt || name || 'Avatar'}
          className={`
            ${sizes[size]}
            rounded-full
            object-cover
            ring-2 ring-[var(--color-cream)]
            shadow-sm
          `}
        />
      ) : (
        <div
          className={`
            ${sizes[size]}
            ${getColorFromName(name)}
            rounded-full
            flex items-center justify-center
            font-semibold text-white
            ring-2 ring-[var(--color-cream)]
            shadow-sm
          `}
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {getInitials(name)}
        </div>
      )}

      {/* Status indicator */}
      {status && (
        <span
          className={`
            absolute ${statusSizes[size]}
            ${statusColors[status]}
            rounded-full
            ring-2 ring-[var(--color-cream)]
          `}
        />
      )}
    </div>
  );
}

// Avatar group for displaying multiple avatars
interface AvatarGroupProps {
  avatars: Array<{ src?: string | null; name?: string }>;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function AvatarGroup({ avatars, max = 4, size = 'md' }: AvatarGroupProps) {
  const visible = avatars.slice(0, max);
  const remaining = avatars.length - max;

  const overlapSizes = {
    sm: '-ml-2 first:ml-0',
    md: '-ml-3 first:ml-0',
    lg: '-ml-4 first:ml-0',
  };

  return (
    <div className="flex items-center">
      {visible.map((avatar, index) => (
        <div
          key={index}
          className={`${overlapSizes[size]} hover:z-10 transition-transform hover:scale-110`}
        >
          <Avatar src={avatar.src} name={avatar.name} size={size} />
        </div>
      ))}
      {remaining > 0 && (
        <div
          className={`
            ${overlapSizes[size]}
            ${size === 'sm' ? 'w-8 h-8 text-xs' : size === 'md' ? 'w-10 h-10 text-sm' : 'w-14 h-14 text-base'}
            rounded-full
            bg-[var(--color-sand-dark)]
            border-2 border-[var(--color-cream)]
            flex items-center justify-center
            font-medium text-[var(--color-ink-muted)]
          `}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
