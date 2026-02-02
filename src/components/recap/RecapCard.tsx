import { Card, Avatar, AvatarGroup, Badge } from '@/components/ui';
import { useTranslation } from '@/lib/i18n';

interface RecapSummary {
  photos_count: number;
  places_count: number;
  contributors: Array<{
    id: string;
    display_name: string;
    avatar_url?: string | null;
    photos_count: number;
  }>;
  meetups_count: number;
  voting_results?: {
    winner?: {
      place_name: string;
      votes: number;
    };
  };
}

interface RecapCardProps {
  recap: {
    id: string;
    week_start: string;
    week_end: string;
    published: boolean;
    summary?: RecapSummary | null;
  };
  onClick?: () => void;
}

function formatWeekRange(weekStart: string, weekEnd: string, locale: string): string {
  const start = new Date(weekStart);
  const end = new Date(weekEnd);

  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  const startStr = start.toLocaleDateString(locale === 'gl' ? 'gl-ES' : 'ca-ES', options);
  const endStr = end.toLocaleDateString(locale === 'gl' ? 'gl-ES' : 'ca-ES', options);

  return `${startStr} - ${endStr}`;
}

export function RecapCard({ recap, onClick }: RecapCardProps) {
  const { t, locale } = useTranslation();
  const summary = recap.summary;

  return (
    <Card
      variant="elevated"
      hover={!!onClick}
      padding="none"
      className="overflow-hidden cursor-pointer"
      onClick={onClick}
    >
      {/* Header with week dates */}
      <div className="bg-gradient-to-r from-[var(--color-sun)] to-[var(--color-sun-dark)] px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p
              className="text-white/80 text-xs uppercase tracking-wide font-medium"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Recap setmanal
            </p>
            <p
              className="text-white text-lg font-semibold mt-0.5"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {formatWeekRange(recap.week_start, recap.week_end, locale)}
            </p>
          </div>
          {summary && summary.meetups_count > 0 && (
            <Badge variant="sun" size="sm">
              {summary.meetups_count} quedada{summary.meetups_count !== 1 ? 'es' : ''}
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {summary ? (
          <div className="space-y-4">
            {/* Stats row */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-[var(--color-sea)]/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-[var(--color-sea)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-[var(--color-ink)]">{summary.photos_count}</p>
                  <p className="text-xs text-[var(--color-ink-muted)]">fotos</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-[var(--color-terracotta)]/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-[var(--color-terracotta)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-[var(--color-ink)]">{summary.places_count}</p>
                  <p className="text-xs text-[var(--color-ink-muted)]">llocs</p>
                </div>
              </div>
            </div>

            {/* Contributors */}
            {summary.contributors.length > 0 && (
              <div className="flex items-center justify-between pt-2 border-t border-[var(--color-terracotta)]/20">
                <AvatarGroup
                  avatars={summary.contributors.map(c => ({
                    src: c.avatar_url,
                    name: c.display_name,
                  }))}
                  max={5}
                  size="sm"
                />
                <span className="text-xs text-[var(--color-ink-muted)]">
                  {summary.contributors.length} participant{summary.contributors.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}

            {/* Voting winner */}
            {summary.voting_results?.winner && (
              <div className="bg-[var(--color-sun-light)]/30 rounded-xl p-3 flex items-center gap-3">
                <span className="text-xl">🏆</span>
                <div>
                  <p className="text-xs text-[var(--color-ink-muted)]">Lloc més votat</p>
                  <p className="font-medium text-[var(--color-ink)]" style={{ fontFamily: 'var(--font-display)' }}>
                    {summary.voting_results.winner.place_name}
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-[var(--color-ink-muted)] italic" style={{ fontFamily: 'var(--font-display)' }}>
              Sense activitat aquesta setmana
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 bg-[var(--color-sand-dark)]/50 flex items-center justify-between">
        <span
          className="text-sm text-[var(--color-sea)] font-medium"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Veure recap complet
        </span>
        <svg className="w-4 h-4 text-[var(--color-sea)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Card>
  );
}
