import type { Database } from '@/lib/database.types';
import { Card } from '@/components/ui';

type Group = Database['public']['Tables']['groups']['Row'];

interface GroupCardProps {
  group: Group;
}

// Generate a color based on group name for variety
function getGroupColor(name: string): { bg: string; text: string; border: string } {
  const colors = [
    { bg: 'bg-[var(--color-sun)]/20', text: 'text-[var(--color-sun-dark)]', border: 'border-[var(--color-sun)]/30' },
    { bg: 'bg-[var(--color-sea)]/20', text: 'text-[var(--color-sea-dark)]', border: 'border-[var(--color-sea)]/30' },
    { bg: 'bg-[var(--color-terracotta)]/20', text: 'text-[var(--color-terracotta)]', border: 'border-[var(--color-terracotta)]/30' },
    { bg: 'bg-[var(--color-success)]/20', text: 'text-[var(--color-success)]', border: 'border-[var(--color-success)]/30' },
  ];
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

export function GroupCard({ group }: GroupCardProps) {
  const colors = getGroupColor(group.name);

  return (
    <a
      href={`/groups/${group.id}`}
      className="block group"
    >
      <Card
        variant="default"
        hover={true}
        padding="md"
        className="h-full"
      >
        <div className="flex items-start gap-4">
          {/* Group avatar */}
          <div
            className={`
              w-14 h-14 rounded-xl
              ${colors.bg} ${colors.border}
              border-2
              flex items-center justify-center flex-shrink-0
              transition-transform duration-300
              group-hover:scale-110 group-hover:rotate-3
            `}
          >
            <span
              className={`text-2xl font-bold ${colors.text}`}
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {group.name.charAt(0).toUpperCase()}
            </span>
          </div>

          {/* Group info */}
          <div className="flex-1 min-w-0">
            <h3
              className="font-semibold text-[var(--color-ink)] truncate text-lg group-hover:text-[var(--color-sun-dark)] transition-colors"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {group.name}
            </h3>
            {group.description ? (
              <p className="text-sm text-[var(--color-ink-muted)] mt-1 line-clamp-2">
                {group.description}
              </p>
            ) : (
              <p
                className="text-sm text-[var(--color-ink-muted)]/60 mt-1 italic"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Sense descripció
              </p>
            )}

            {/* Stats row (placeholder for future) */}
            <div className="flex items-center gap-4 mt-3 text-xs text-[var(--color-ink-muted)]">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
                {group.max_members} màx
              </span>
            </div>
          </div>

          {/* Arrow indicator */}
          <div className="flex-shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300">
            <div className="w-8 h-8 rounded-full bg-[var(--color-sun)]/20 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-[var(--color-sun-dark)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>
        </div>
      </Card>
    </a>
  );
}
