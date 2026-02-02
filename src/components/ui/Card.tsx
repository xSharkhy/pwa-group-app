import { type HTMLAttributes, forwardRef } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'polaroid' | 'pinned';
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      variant = 'default',
      hover = true,
      padding = 'md',
      className = '',
      ...props
    },
    ref
  ) => {
    const baseStyles = `
      relative
      bg-[var(--color-cream)]
      rounded-2xl
      transition-all duration-300 ease-out
    `;

    const variants = {
      default: `
        border-2 border-[var(--color-terracotta)]/30
        shadow-sm
        ${hover ? 'hover:border-[var(--color-sun)]/50 hover:shadow-md hover:-translate-y-1' : ''}
      `,
      elevated: `
        border border-[var(--color-terracotta)]/20
        shadow-lg
        ${hover ? 'hover:shadow-xl hover:-translate-y-1' : ''}
      `,
      polaroid: `
        bg-white
        border-4 border-white
        shadow-lg
        pb-12
        ${hover ? 'hover:shadow-xl hover:-rotate-1 hover:-translate-y-1' : ''}
      `,
      pinned: `
        border-2 border-[var(--color-terracotta)]/30
        shadow-md
        before:content-['']
        before:absolute before:-top-2 before:left-1/2 before:-translate-x-1/2
        before:w-4 before:h-4 before:rounded-full
        before:bg-[var(--color-sun)]
        before:shadow-md
        before:z-10
        ${hover ? 'hover:shadow-lg hover:-translate-y-0.5' : ''}
      `,
    };

    const paddings = {
      none: '',
      sm: 'p-3',
      md: 'p-5',
      lg: 'p-8',
    };

    return (
      <div
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${paddings[padding]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// Photo Card - special variant for the gallery
export function PhotoCard({
  src,
  alt,
  author,
  date,
  onClick,
  className = '',
}: {
  src: string;
  alt?: string;
  author?: string;
  date?: string;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <div
      onClick={onClick}
      className={`
        group relative cursor-pointer
        bg-white p-2 pb-8
        rounded-sm
        shadow-md
        transition-all duration-300 ease-out
        hover:shadow-xl hover:-rotate-2 hover:-translate-y-2
        hover:z-10
        ${className}
      `}
      style={{
        transform: `rotate(${Math.random() * 4 - 2}deg)`,
      }}
    >
      {/* Photo */}
      <div className="aspect-square overflow-hidden bg-[var(--color-sand-dark)]">
        <img
          src={src}
          alt={alt || ''}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
      </div>

      {/* Caption area - like a polaroid */}
      <div className="absolute bottom-2 left-2 right-2 text-center">
        {author && (
          <p
            className="text-xs text-[var(--color-ink-muted)] truncate"
            style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic' }}
          >
            {author}
          </p>
        )}
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-sm pointer-events-none" />
    </div>
  );
}
