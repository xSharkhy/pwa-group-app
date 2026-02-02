import { useState, useEffect } from 'react';
import { Button } from '@/components/ui';
import { useTranslation } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';

interface InviteManagerProps {
  groupId: string;
}

interface Invite {
  id: string;
  code: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function InviteManager({ groupId }: InviteManagerProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { success } = useToast();

  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchInvites();
  }, [groupId]);

  const fetchInvites = async () => {
    const { data, error } = await supabase
      .from('group_invites')
      .select('*')
      .eq('group_id', groupId)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (!error) {
      setInvites(data || []);
    }
    setLoading(false);
  };

  const generateInvite = async () => {
    if (!user) return;

    try {
      setGenerating(true);

      const code = generateCode();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

      const { data, error } = await supabase
        .from('group_invites')
        .insert({
          group_id: groupId,
          code,
          created_by: user.id,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      setInvites((prev) => [data, ...prev]);
    } catch (err) {
      console.error('Error generating invite:', err);
    } finally {
      setGenerating(false);
    }
  };

  const copyInviteLink = async (code: string) => {
    const url = `${window.location.origin}/groups/join/${code}`;
    await navigator.clipboard.writeText(url);
    success(t('groups.invite.copied'));
  };

  const shareInvite = async (code: string) => {
    const url = `${window.location.origin}/groups/join/${code}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: t('groups.invite.title'),
          text: t('groups.invite.title'),
          url,
        });
      } catch {
        // User cancelled or share failed
        copyInviteLink(code);
      }
    } else {
      copyInviteLink(code);
    }
  };

  const getDaysUntilExpiry = (expiresAt: string): number => {
    const expires = new Date(expiresAt);
    const now = new Date();
    const diffTime = expires.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">
          {t('groups.invite.title')}
        </h3>
        <Button size="sm" onClick={generateInvite} loading={generating}>
          {t('groups.invite.generateCode')}
        </Button>
      </div>

      {invites.length > 0 ? (
        <div className="space-y-3">
          {invites.map((invite) => (
            <div
              key={invite.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div>
                <code className="text-lg font-mono font-bold text-indigo-600">
                  {invite.code}
                </code>
                <p className="text-xs text-gray-500 mt-1">
                  {t('groups.invite.expires', {
                    days: getDaysUntilExpiry(invite.expires_at),
                  })}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => copyInviteLink(invite.code)}
                  className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title={t('groups.invite.copy')}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => shareInvite(invite.code)}
                  className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title={t('groups.invite.share')}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 text-center py-4">
          {t('groups.invite.active')}: 0
        </p>
      )}
    </div>
  );
}
