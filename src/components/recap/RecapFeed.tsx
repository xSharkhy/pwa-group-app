import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { RecapCard } from './RecapCard';
import { EmptyRecaps, SkeletonCard } from '@/components/ui';

interface RecapFeedProps {
  groupId: string;
  onRecapClick?: (recapId: string) => void;
}

interface Recap {
  id: string;
  week_start: string;
  week_end: string;
  published: boolean;
  summary: any;
}

export function RecapFeed({ groupId, onRecapClick }: RecapFeedProps) {
  const [recaps, setRecaps] = useState<Recap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize click handler to prevent re-renders of RecapCard
  const handleRecapClick = useCallback(
    (recapId: string) => {
      onRecapClick?.(recapId);
    },
    [onRecapClick]
  );

  useEffect(() => {
    async function fetchRecaps() {
      try {
        // Select only needed columns - summary is large JSONB, fetch only what's needed for list
        const { data, error } = await supabase
          .from('weekly_recaps')
          .select('id, week_start, week_end, published, summary')
          .eq('group_id', groupId)
          .eq('published', true)
          .order('week_start', { ascending: false })
          .limit(12);

        if (error) throw error;
        setRecaps(data || []);
      } catch (err) {
        console.error('Error fetching recaps:', err);
        setError('Error carregant els recaps');
      } finally {
        setLoading(false);
      }
    }

    fetchRecaps();
  }, [groupId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-[var(--color-error)]">{error}</p>
      </div>
    );
  }

  if (recaps.length === 0) {
    return <EmptyRecaps />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2
          className="text-xl font-bold text-[var(--color-ink)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Recaps setmanals
        </h2>
        <span className="text-sm text-[var(--color-ink-muted)]">
          {recaps.length} recap{recaps.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Recaps list */}
      <div className="space-y-4">
        {recaps.map((recap, index) => (
          <div
            key={recap.id}
            className="animate-fade-in-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <RecapCard
              recap={recap}
              onClick={() => handleRecapClick(recap.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
