import { useGroups } from '@/hooks/useGroups';
import { useTranslation } from '@/lib/i18n';
import { Button, SkeletonCard, EmptyGroups } from '@/components/ui';
import { GroupCard } from './GroupCard';

interface GroupListProps {
  onCreateClick: () => void;
  onJoinClick: () => void;
}

export function GroupList({ onCreateClick, onJoinClick }: GroupListProps) {
  const { t } = useTranslation();
  const { groups, loading } = useGroups();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-32 bg-[var(--color-sand-dark)] rounded-lg animate-pulse" />
          <div className="flex gap-2">
            <div className="h-9 w-24 bg-[var(--color-sand-dark)] rounded-xl animate-pulse" />
            <div className="h-9 w-24 bg-[var(--color-sand-dark)] rounded-xl animate-pulse" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="animate-fade-in-up">
        <EmptyGroups onCreate={onCreateClick} />
        <div className="flex justify-center mt-4">
          <button
            onClick={onJoinClick}
            className="text-[var(--color-sea)] hover:text-[var(--color-sea-dark)] text-sm font-medium transition-colors"
          >
            {t('groups.empty.joinCta')} →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-2xl font-bold text-[var(--color-ink)]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {t('groups.title')}
          </h1>
          <p className="text-[var(--color-ink-muted)] text-sm mt-1">
            {groups.length} {groups.length === 1 ? 'grup' : 'grups'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={onJoinClick}>
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            {t('groups.empty.joinCta')}
          </Button>
          <Button size="sm" variant="sun" onClick={onCreateClick}>
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            {t('common.create')}
          </Button>
        </div>
      </div>

      {/* Groups grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {groups.map((group, index) => (
          <div
            key={group.id}
            className="animate-fade-in-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <GroupCard group={group} />
          </div>
        ))}
      </div>
    </div>
  );
}
