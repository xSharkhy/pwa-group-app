import { type HTMLAttributes } from 'react';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animate?: boolean;
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  animate = true,
  className = '',
  style,
  ...props
}: SkeletonProps) {
  const variants = {
    text: 'rounded-md',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-xl',
  };

  const defaultHeights = {
    text: '1em',
    circular: '40px',
    rectangular: '100px',
    rounded: '100px',
  };

  return (
    <div
      className={`
        bg-[var(--color-sand-dark)]
        ${variants[variant]}
        ${animate ? 'animate-pulse' : ''}
        ${className}
      `}
      style={{
        width: width || (variant === 'circular' ? '40px' : '100%'),
        height: height || defaultHeights[variant],
        ...style,
      }}
      {...props}
    />
  );
}

// Preset skeleton components for common use cases
export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          width={i === lines - 1 ? '60%' : '100%'}
          height="0.875rem"
        />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-[var(--color-cream)] rounded-2xl border-2 border-[var(--color-terracotta)]/20 p-5 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="60%" height="1rem" />
          <Skeleton variant="text" width="40%" height="0.75rem" />
        </div>
      </div>
      <Skeleton variant="rounded" height={120} />
      <SkeletonText lines={2} />
    </div>
  );
}

export function SkeletonPhotoGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white p-2 pb-8 rounded-sm shadow-md"
          style={{
            transform: `rotate(${Math.random() * 4 - 2}deg)`,
          }}
        >
          <Skeleton variant="rectangular" className="aspect-square" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 bg-[var(--color-cream)] rounded-xl"
        >
          <Skeleton variant="circular" width={40} height={40} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="70%" height="0.875rem" />
            <Skeleton variant="text" width="40%" height="0.75rem" />
          </div>
        </div>
      ))}
    </div>
  );
}
