import { Card, Avatar, AvatarGroup, Badge, Button } from '@/components/ui';

interface MeetupParticipant {
  user_id: string;
  display_name: string;
  avatar_url?: string | null;
  confirmed: boolean;
}

interface MeetupCardProps {
  meetup: {
    id: string;
    place_name?: string;
    detected_at: string;
    lat?: number | null;
    lng?: number | null;
    is_confirmed: boolean;
    participants: MeetupParticipant[];
  };
  currentUserId?: string;
  onConfirmParticipation?: (meetupId: string, confirmed: boolean) => void;
  onConfirmMeetup?: (meetupId: string) => void;
  isAdmin?: boolean;
}

function formatDateTime(dateString: string, locale: string): { date: string; time: string } {
  const date = new Date(dateString);

  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  };
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
  };

  const localeStr = locale === 'gl' ? 'gl-ES' : 'ca-ES';

  return {
    date: date.toLocaleDateString(localeStr, dateOptions),
    time: date.toLocaleTimeString(localeStr, timeOptions),
  };
}

export function MeetupCard({
  meetup,
  currentUserId,
  onConfirmParticipation,
  onConfirmMeetup,
  isAdmin,
}: MeetupCardProps) {
  const { date, time } = formatDateTime(meetup.detected_at, 'ca');

  const currentUserParticipant = meetup.participants.find(p => p.user_id === currentUserId);
  const isCurrentUserConfirmed = currentUserParticipant?.confirmed || false;
  const confirmedCount = meetup.participants.filter(p => p.confirmed).length;

  return (
    <Card variant="polaroid" padding="none" className="overflow-hidden">
      {/* Header */}
      <div className="relative bg-[var(--color-sea)]/10 px-5 py-4">
        {/* Detection badge */}
        <div className="absolute -top-2 -right-2">
          {meetup.is_confirmed ? (
            <Badge variant="success" size="sm">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Confirmat
            </Badge>
          ) : (
            <Badge variant="muted" size="sm" dot>
              Detectat
            </Badge>
          )}
        </div>

        {/* Location */}
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-[var(--color-sea)] flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3
              className="font-semibold text-[var(--color-ink)] truncate"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {meetup.place_name || 'Lloc sense nom'}
            </h3>
            <p className="text-sm text-[var(--color-ink-muted)] mt-0.5">
              {date}
            </p>
            <p className="text-sm text-[var(--color-ink-light)]">
              🕐 {time}
            </p>
          </div>
        </div>
      </div>

      {/* Participants */}
      <div className="px-5 py-4 space-y-4">
        <div>
          <p className="text-xs text-[var(--color-ink-muted)] uppercase tracking-wide mb-2 font-medium">
            Qui hi era? ({confirmedCount}/{meetup.participants.length})
          </p>

          <div className="space-y-2">
            {meetup.participants.map((participant) => (
              <div
                key={participant.user_id}
                className={`
                  flex items-center gap-3 p-2 rounded-xl transition-colors
                  ${participant.confirmed
                    ? 'bg-[var(--color-success)]/10'
                    : 'bg-[var(--color-sand-dark)]'
                  }
                `}
              >
                <Avatar
                  src={participant.avatar_url}
                  name={participant.display_name}
                  size="sm"
                />
                <span
                  className={`flex-1 text-sm font-medium ${
                    participant.confirmed
                      ? 'text-[var(--color-ink)]'
                      : 'text-[var(--color-ink-muted)]'
                  }`}
                >
                  {participant.display_name}
                </span>
                {participant.confirmed ? (
                  <svg className="w-5 h-5 text-[var(--color-success)]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <span className="text-xs text-[var(--color-ink-muted)]">?</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        {currentUserId && currentUserParticipant && (
          <div className="pt-2 border-t border-[var(--color-terracotta)]/20">
            <Button
              variant={isCurrentUserConfirmed ? 'ghost' : 'sea'}
              size="sm"
              className="w-full"
              onClick={() => onConfirmParticipation?.(meetup.id, !isCurrentUserConfirmed)}
            >
              {isCurrentUserConfirmed ? (
                <>
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  No hi era
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Sí, hi era!
                </>
              )}
            </Button>
          </div>
        )}

        {/* Admin confirm */}
        {isAdmin && !meetup.is_confirmed && confirmedCount >= 2 && (
          <Button
            variant="sun"
            size="sm"
            className="w-full"
            onClick={() => onConfirmMeetup?.(meetup.id)}
          >
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Confirmar quedada
          </Button>
        )}
      </div>
    </Card>
  );
}
