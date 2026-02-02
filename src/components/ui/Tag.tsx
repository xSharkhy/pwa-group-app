import { type HTMLAttributes, type ReactNode } from 'react';

interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  color?: string;
  icon?: ReactNode;
  removable?: boolean;
  onRemove?: () => void;
}

export function Tag({
  children,
  color,
  icon,
  removable,
  onRemove,
  className = '',
  ...props
}: TagProps) {
  // Generate background color with low opacity
  const bgColor = color ? `${color}20` : 'var(--color-terracotta)20';
  const borderColor = color ? `${color}40` : 'var(--color-terracotta)40';
  const textColor = color || 'var(--color-ink)';

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        px-3 py-1
        text-sm font-medium
        rounded-lg
        border
        transition-all duration-200
        hover:shadow-sm
        ${className}
      `}
      style={{
        backgroundColor: bgColor,
        borderColor: borderColor,
        color: textColor,
      }}
      {...props}
    >
      {icon && <span className="w-4 h-4 flex-shrink-0">{icon}</span>}
      {children}
      {removable && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          className="
            ml-1 -mr-1
            p-0.5 rounded
            hover:bg-black/10
            transition-colors
          "
        >
          <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </span>
  );
}

// Category tag with icon support
interface CategoryTagProps {
  name: string;
  iconName?: string;
  color?: string;
  onClick?: () => void;
  selected?: boolean;
}

export function CategoryTag({
  name,
  iconName,
  color = 'var(--color-terracotta)',
  onClick,
  selected,
}: CategoryTagProps) {
  // Map icon names to simple emoji or svg
  const iconMap: Record<string, string> = {
    restaurant: '🍽️',
    bar: '🍸',
    cafe: '☕',
    beach: '🏖️',
    mountain: '⛰️',
    museum: '🏛️',
    park: '🌳',
    shopping: '🛍️',
    entertainment: '🎭',
    sports: '⚽',
    other: '📍',
  };

  const icon = iconName ? iconMap[iconName] || '📍' : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        inline-flex items-center gap-2
        px-3 py-1.5
        text-sm font-medium
        rounded-xl
        border-2
        transition-all duration-200
        ${selected
          ? 'shadow-md -translate-y-0.5'
          : 'hover:shadow-sm hover:-translate-y-0.5'
        }
      `}
      style={{
        backgroundColor: selected ? `${color}30` : 'var(--color-cream)',
        borderColor: selected ? color : `${color}40`,
        color: selected ? color : 'var(--color-ink)',
      }}
    >
      {icon && <span>{icon}</span>}
      {name}
    </button>
  );
}
