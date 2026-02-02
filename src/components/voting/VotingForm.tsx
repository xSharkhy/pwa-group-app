import { useState, useEffect } from 'react';
import { Button, Input, Select, Card } from '@/components/ui';
import { useTranslation } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface Place {
  id: string;
  name: string;
}

interface VotingFormProps {
  groupId: string;
  weekStart: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const PRETEXT_OPTIONS = [
  { value: 'almuerzo', label: 'Esmorzar/Almuerzo' },
  { value: 'comida', label: 'Dinar/Comida' },
  { value: 'cena', label: 'Sopar/Cena' },
  { value: 'tardeo', label: 'Tardeo' },
  { value: 'otro', label: 'Altre' },
];

export function VotingForm({ groupId, weekStart, onSuccess, onCancel }: VotingFormProps) {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState('');
  const [customPlace, setCustomPlace] = useState('');
  const [proposedDate, setProposedDate] = useState('');
  const [proposedTime, setProposedTime] = useState('');
  const [pretext, setPretext] = useState('');
  const [pretextCustom, setPretextCustom] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlaces() {
      const { data } = await supabase
        .from('places')
        .select('id, name')
        .eq('group_id', groupId)
        .order('name');

      if (data) {
        setPlaces(data);
      }
    }

    fetchPlaces();
  }, [groupId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const placeId = selectedPlace || null;
    const placeText = !selectedPlace && customPlace ? customPlace : null;

    if (!placeId && !placeText) {
      setError('Has de seleccionar o escriure un lloc');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { error: insertError } = await supabase
        .from('weekly_votes')
        .insert({
          group_id: groupId,
          week_start: weekStart,
          user_id: user.id,
          place_id: placeId,
          place_text: placeText,
          proposed_date: proposedDate || null,
          proposed_time: proposedTime || null,
          pretext: pretext || null,
          pretext_custom: pretext === 'otro' ? pretextCustom : null,
        });

      if (insertError) throw insertError;

      onSuccess?.();
    } catch (err) {
      console.error('Error submitting vote:', err);
      setError(t('errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card variant="elevated" padding="lg">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-[var(--color-sea)]/20 rounded-2xl mb-3">
          <svg className="w-7 h-7 text-[var(--color-sea)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
        <h3
          className="text-lg font-semibold text-[var(--color-ink)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Proposa un pla
        </h3>
        <p
          className="text-sm text-[var(--color-ink-muted)] mt-1"
          style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic' }}
        >
          On vols quedar aquesta setmana?
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-[var(--color-error)]/10 border-2 border-[var(--color-error)]/30 rounded-xl text-[var(--color-error)] text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Place selection */}
        <div>
          <Select
            label="Lloc"
            placeholder="Selecciona un lloc..."
            options={places.map(p => ({ value: p.id, label: p.name }))}
            value={selectedPlace}
            onChange={(e) => {
              setSelectedPlace(e.target.value);
              if (e.target.value) setCustomPlace('');
            }}
          />
          <p className="text-xs text-[var(--color-ink-muted)] mt-2 text-center">o</p>
          <Input
            placeholder="Escriu un lloc nou..."
            value={customPlace}
            onChange={(e) => {
              setCustomPlace(e.target.value);
              if (e.target.value) setSelectedPlace('');
            }}
            disabled={!!selectedPlace}
          />
        </div>

        {/* Date and time */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            type="date"
            label="Data proposada"
            value={proposedDate}
            onChange={(e) => setProposedDate(e.target.value)}
          />
          <Input
            type="time"
            label="Hora"
            value={proposedTime}
            onChange={(e) => setProposedTime(e.target.value)}
          />
        </div>

        {/* Pretext */}
        <Select
          label="Tipus de quedada"
          placeholder="Selecciona..."
          options={PRETEXT_OPTIONS}
          value={pretext}
          onChange={(e) => setPretext(e.target.value)}
        />

        {pretext === 'otro' && (
          <Input
            placeholder="Especifica el tipus..."
            value={pretextCustom}
            onChange={(e) => setPretextCustom(e.target.value)}
          />
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              className="flex-1"
            >
              Cancel·lar
            </Button>
          )}
          <Button
            type="submit"
            variant="sea"
            loading={loading}
            className="flex-1"
          >
            <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Proposar
          </Button>
        </div>
      </form>
    </Card>
  );
}
