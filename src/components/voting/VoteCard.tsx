import { Card, Avatar, Badge, Button } from '@/components/ui';

interface VoteCardProps {
  vote: {
    id: string;
    place_name: string;
    proposed_date?: string | null;
    proposed_time?: string | null;
    pretext?: string | null;
    pretext_custom?: string | null;
    user: {
      id: string;
      display_name: string;
      avatar_url?: string | null;
    };
    votes_count: number;
    has_voted: boolean;
  };
  rank?: number;
  onVote?: (voteId: string) => void;
  onUnvote?: (voteId: string) => void;
  disabled?: boolean;
}

const PRETEXT_LABELS: Record<string, string> = {
  almuerzo: 'Esmorzar',
  comida: 'Dinar',
  cena: 'Sopar',
  tardeo: 'Tardeo',
  otro: 'Altre',
};

const PRETEXT_EMOJIS: Record<string, string> = {
  almuerzo: '🥐',
  comida: '🍝',
  cena: '🌙',
  tardeo: '🍹',
  otro: '📍',
};

function formatDate(dateStr: string, locale: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(locale === 'gl' ? 'gl-ES' : 'ca-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function formatTime(timeStr: string): string {
  return timeStr.slice(0, 5); // HH:MM
}

export function VoteCard({
  vote,
  rank,
  onVote,
  onUnvote,
  disabled,
}: VoteCardProps) {
  const pretextLabel = vote.pretext
    ? (vote.pretext === 'otro' && vote.pretext_custom)
      ? vote.pretext_custom
      : PRETEXT_LABELS[vote.pretext]
    : null;
  const pretextEmoji = vote.pretext ? PRETEXT_EMOJIS[vote.pretext] || '📍' : null;

  const isTopThree = rank !== undefined && rank <= 3;
  const medals = ['🥇', '🥈', '🥉'];

  return (
    <Card
      variant={isTopThree ? 'elevated' : 'default'}
      hover={!disabled}
      padding="md"
      className={`
        ${vote.has_voted ? 'ring-2 ring-[var(--color-sea)]' : ''}
        ${isTopThree ? 'border-[var(--color-sun)]/50' : ''}
      `}
    >
      <div className="flex items-start gap-4">
        {/* Rank medal or avatar */}
        {isTopThree ? (
          <div className="flex-shrink-0 text-3xl">{medals[rank - 1]}</div>
        ) : (
          <Avatar
            src={vote.user.avatar_url}
            name={vote.user.display_name}
            size="md"
          />
        )}

        {/* Vote info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4
                className="font-semibold text-[var(--color-ink)] text-lg"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {vote.place_name}
              </h4>
              {!isTopThree && (
                <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
                  Proposat per {vote.user.display_name}
                </p>
              )}
            </div>

            {/* Vote count */}
            <div className="flex-shrink-0 text-center">
              <span className="text-2xl font-bold text-[var(--color-ink)]">
                {vote.votes_count}
              </span>
              <p className="text-xs text-[var(--color-ink-muted)]">
                vot{vote.votes_count !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {pretextLabel && (
              <Badge variant="sea" size="sm">
                {pretextEmoji} {pretextLabel}
              </Badge>
            )}
            {vote.proposed_date && (
              <Badge variant="muted" size="sm">
                📅 {formatDate(vote.proposed_date, 'ca')}
              </Badge>
            )}
            {vote.proposed_time && (
              <Badge variant="muted" size="sm">
                🕐 {formatTime(vote.proposed_time)}
              </Badge>
            )}
          </div>

          {/* Vote button */}
          {(onVote || onUnvote) && !disabled && (
            <div className="mt-4">
              {vote.has_voted ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onUnvote?.(vote.id)}
                >
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Ja hi has votat
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onVote?.(vote.id)}
                >
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                  </svg>
                  Votar +1
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
