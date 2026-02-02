import { useState } from 'react';
import { Button, Input } from '@/components/ui';
import { useTranslation } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface GroupJoinFormProps {
  initialCode?: string;
  onSuccess: (groupId: string) => void;
  onCancel: () => void;
}

export function GroupJoinForm({
  initialCode = '',
  onSuccess,
  onCancel,
}: GroupJoinFormProps) {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [code, setCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !code.trim()) return;

    try {
      setLoading(true);
      setError(null);

      // Find the invite
      const { data: invite, error: inviteError } = await supabase
        .from('group_invites')
        .select('*, group:groups(*)')
        .eq('code', code.trim().toUpperCase())
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (inviteError || !invite) {
        setError(t('groups.join.invalidCode'));
        return;
      }

      // Check if already a member
      const { data: existingMember } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', invite.group_id)
        .eq('user_id', user.id)
        .single();

      if (existingMember) {
        setError(t('groups.join.alreadyMember'));
        return;
      }

      // Check group capacity
      const { count } = await supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', invite.group_id);

      if (count && invite.group && count >= invite.group.max_members) {
        setError(t('groups.join.groupFull'));
        return;
      }

      // Add member
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: invite.group_id,
          user_id: user.id,
          role: 'member',
        });

      if (memberError) throw memberError;

      // Mark invite as used
      await supabase
        .from('group_invites')
        .update({
          used_at: new Date().toISOString(),
          used_by: user.id,
        })
        .eq('id', invite.id);

      // Initialize user stats for this group
      await supabase.from('user_stats').insert({
        user_id: user.id,
        group_id: invite.group_id,
      });

      onSuccess(invite.group_id);
    } catch (err) {
      console.error('Error joining group:', err);
      setError(t('errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {t('groups.join.title')}
        </h1>
        <p className="text-gray-600 mt-1">{t('groups.join.subtitle')}</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          placeholder={t('groups.join.codePlaceholder')}
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          required
          maxLength={8}
          className="text-center text-lg tracking-widest font-mono"
        />

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            className="flex-1"
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            loading={loading}
            disabled={!code.trim()}
            className="flex-1"
          >
            {t('groups.join.submit')}
          </Button>
        </div>
      </form>
    </div>
  );
}
