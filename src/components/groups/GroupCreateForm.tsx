import { useState } from 'react';
import { Button, Input } from '@/components/ui';
import { useTranslation } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface GroupCreateFormProps {
  onSuccess: (groupId: string) => void;
  onCancel: () => void;
}

export function GroupCreateForm({ onSuccess, onCancel }: GroupCreateFormProps) {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;

    try {
      setLoading(true);
      setError(null);

      // Create the group
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          owner_id: user.id,
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add owner as admin member
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: 'admin',
        });

      if (memberError) throw memberError;

      // Initialize user stats for this group
      await supabase.from('user_stats').insert({
        user_id: user.id,
        group_id: group.id,
      });

      onSuccess(group.id);
    } catch (err) {
      console.error('Error creating group:', err);
      setError(t('errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Decorative header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-[var(--color-sun)]/20 rounded-2xl mb-3">
          <svg
            className="w-7 h-7 text-[var(--color-sun-dark)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
            />
          </svg>
        </div>
        <p
          className="text-[var(--color-ink-muted)] text-sm"
          style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic' }}
        >
          {t('groups.create.subtitle')}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-[var(--color-error)]/10 border-2 border-[var(--color-error)]/30 rounded-xl text-[var(--color-error)] text-sm flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label={t('groups.create.name')}
          placeholder={t('groups.create.namePlaceholder')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={50}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
            </svg>
          }
        />

        <div>
          <label
            className="block text-sm font-medium text-[var(--color-ink)] mb-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {t('groups.create.description')}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('groups.create.descriptionPlaceholder')}
            rows={3}
            maxLength={200}
            className="
              w-full px-4 py-3
              bg-[var(--color-cream)]
              border-2 border-[var(--color-terracotta)]/50 rounded-xl
              text-[var(--color-ink)]
              placeholder:text-[var(--color-ink-muted)]
              transition-all duration-200 ease-out
              focus:outline-none focus:border-[var(--color-sun)] focus:ring-4 focus:ring-[var(--color-sun-light)]/30
              hover:border-[var(--color-terracotta)]
              resize-none
            "
          />
          <p className="mt-1 text-xs text-[var(--color-ink-muted)] text-right">
            {description.length}/200
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            className="flex-1"
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            variant="sun"
            loading={loading}
            disabled={!name.trim()}
            className="flex-1"
          >
            <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            {t('groups.create.submit')}
          </Button>
        </div>
      </form>
    </div>
  );
}
