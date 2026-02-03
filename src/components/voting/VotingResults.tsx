import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { VoteCard } from './VoteCard';
import { Card, Badge, SkeletonList } from '@/components/ui';

interface VotingResultsProps {
  groupId: string;
  weekStart: string;
  closed?: boolean;
}

interface Vote {
  id: string;
  place_id: string | null;
  place_text: string | null;
  proposed_date: string | null;
  proposed_time: string | null;
  pretext: string | null;
  pretext_custom: string | null;
  user_id: string;
  profiles: {
    display_name: string;
    avatar_url: string | null;
  };
}

interface AggregatedVote {
  id: string;
  place_id: string | null; // Original place_id for voting
  place_text: string | null; // Original place_text for voting
  place_name: string; // Display name (resolved from place_id or place_text)
  proposed_date: string | null;
  proposed_time: string | null;
  pretext: string | null;
  pretext_custom: string | null;
  user: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  };
  votes_count: number;
  has_voted: boolean;
  voters: string[];
}

export function VotingResults({ groupId, weekStart, closed }: VotingResultsProps) {
  const { user } = useAuth();
  const [votes, setVotes] = useState<AggregatedVote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVotes = async () => {
    try {
      const { data, error } = await supabase
        .from('weekly_votes')
        .select(`
          id,
          place_id,
          place_text,
          proposed_date,
          proposed_time,
          pretext,
          pretext_custom,
          user_id,
          profiles:user_id (
            display_name,
            avatar_url
          )
        `)
        .eq('group_id', groupId)
        .eq('week_start', weekStart) as { data: Vote[] | null; error: any };

      if (error) throw error;

      // Batch fetch all places in ONE query (eliminates N+1)
      const placeIds = [...new Set((data || []).map(v => v.place_id).filter(Boolean))] as string[];
      const placesMap = new Map<string, string>();

      if (placeIds.length > 0) {
        const { data: places } = await supabase
          .from('places')
          .select('id, name')
          .in('id', placeIds);

        places?.forEach(p => placesMap.set(p.id, p.name));
      }

      // Group votes by place (no more individual queries)
      const voteMap = new Map<string, AggregatedVote>();

      for (const vote of data || []) {
        // Get place name from pre-fetched map
        const placeName = vote.place_id
          ? placesMap.get(vote.place_id) || vote.place_text || 'Lloc desconegut'
          : vote.place_text || 'Lloc desconegut';

        const key = vote.place_id || vote.place_text || 'unknown';

        if (voteMap.has(key)) {
          const existing = voteMap.get(key)!;
          existing.votes_count++;
          existing.voters.push(vote.user_id);
          if (vote.user_id === user?.id) {
            existing.has_voted = true;
          }
        } else {
          voteMap.set(key, {
            id: vote.id,
            place_id: vote.place_id, // Store original place_id for voting
            place_text: vote.place_text, // Store original place_text for voting
            place_name: placeName,
            proposed_date: vote.proposed_date,
            proposed_time: vote.proposed_time,
            pretext: vote.pretext,
            pretext_custom: vote.pretext_custom,
            user: {
              id: vote.user_id,
              display_name: vote.profiles?.display_name || 'Usuari',
              avatar_url: vote.profiles?.avatar_url || null,
            },
            votes_count: 1,
            has_voted: vote.user_id === user?.id,
            voters: [vote.user_id],
          });
        }
      }

      // Sort by votes count
      const sorted = Array.from(voteMap.values()).sort(
        (a, b) => b.votes_count - a.votes_count
      );

      setVotes(sorted);
    } catch (err) {
      console.error('Error fetching votes:', err);
      setError('Error carregant les votacions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVotes();
  }, [groupId, weekStart, user?.id]);

  const handleVote = async (voteId: string) => {
    if (!user) return;

    // Find the original vote to get place info
    const originalVote = votes.find(v => v.id === voteId);
    if (!originalVote) return;

    // Check if user already voted for this option
    if (originalVote.has_voted) {
      console.log('User already voted for this option');
      return;
    }

    try {
      // Use the original place_id and place_text from the vote
      await supabase.from('weekly_votes').insert({
        group_id: groupId,
        week_start: weekStart,
        user_id: user.id,
        place_id: originalVote.place_id, // Use original place_id (can be null)
        place_text: originalVote.place_text, // Use original place_text (can be null)
        proposed_date: originalVote.proposed_date,
        proposed_time: originalVote.proposed_time,
        pretext: originalVote.pretext,
        pretext_custom: originalVote.pretext_custom,
      });

      fetchVotes();
    } catch (err) {
      console.error('Error voting:', err);
    }
  };

  if (loading) {
    return <SkeletonList count={3} />;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-[var(--color-error)]">{error}</p>
      </div>
    );
  }

  if (votes.length === 0) {
    return (
      <Card variant="default" padding="lg" className="text-center">
        <div className="w-16 h-16 bg-[var(--color-sea)]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-[var(--color-sea)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3
          className="text-lg font-semibold text-[var(--color-ink)] mb-2"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Cap proposta encara
        </h3>
        <p
          className="text-[var(--color-ink-muted)]"
          style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic' }}
        >
          Sigues el primer en proposar un pla!
        </p>
      </Card>
    );
  }

  const totalVotes = useMemo(() => votes.reduce((sum, v) => sum + v.votes_count, 0), [votes]);

  return (
    <div className="space-y-4">
      {/* Summary header */}
      <div className="flex items-center justify-between">
        <div>
          <h3
            className="text-lg font-semibold text-[var(--color-ink)]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {closed ? 'Resultats finals' : 'Propostes actuals'}
          </h3>
          <p className="text-sm text-[var(--color-ink-muted)]">
            {totalVotes} vot{totalVotes !== 1 ? 's' : ''} en {votes.length} proposta{votes.length !== 1 ? 'es' : ''}
          </p>
        </div>
        {closed && (
          <Badge variant="warning" size="md">
            Votació tancada
          </Badge>
        )}
      </div>

      {/* Votes list */}
      <div className="space-y-3">
        {votes.map((vote, index) => (
          <div
            key={vote.id}
            className="animate-fade-in-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <VoteCard
              vote={vote}
              rank={index + 1}
              onVote={closed ? undefined : handleVote}
              disabled={closed}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
