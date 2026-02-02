import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button, Input, Card } from '@/components/ui';

interface AllowedEmail {
  id: string;
  email: string;
  note: string | null;
  created_at: string;
}

export function EmailWhitelist() {
  const [emails, setEmails] = useState<AllowedEmail[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEmails = async () => {
    const { data, error } = await supabase
      .from('allowed_emails')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching whitelist:', error);
    } else {
      setEmails(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    setAdding(true);
    setError(null);

    const { error } = await supabase
      .from('allowed_emails')
      .insert({
        email: newEmail.trim().toLowerCase(),
        note: note.trim() || null,
      });

    if (error) {
      if (error.code === '23505') {
        setError('Aquest email ja està a la llista');
      } else {
        setError(error.message);
      }
    } else {
      setNewEmail('');
      setNote('');
      fetchEmails();
    }

    setAdding(false);
  };

  const handleRemove = async (id: string) => {
    const { error } = await supabase
      .from('allowed_emails')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error removing email:', error);
    } else {
      fetchEmails();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2
          className="text-xl font-bold text-[var(--color-ink)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Emails autoritzats
        </h2>
        <p className="text-sm text-[var(--color-ink-muted)] mt-1">
          Només aquests emails poden crear compte
        </p>
      </div>

      {/* Add new email form */}
      <Card variant="default" padding="md">
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              type="email"
              placeholder="email@example.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="flex-1"
              required
            />
            <Input
              type="text"
              placeholder="Nota (opcional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="flex-1"
            />
          </div>
          {error && (
            <p className="text-sm text-[var(--color-error)]">{error}</p>
          )}
          <Button type="submit" variant="sun" loading={adding} disabled={!newEmail.trim()}>
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Afegir email
          </Button>
        </form>
      </Card>

      {/* Email list */}
      <div className="space-y-2">
        {loading ? (
          <p className="text-[var(--color-ink-muted)] text-center py-4">Carregant...</p>
        ) : emails.length === 0 ? (
          <Card variant="default" padding="md" className="text-center">
            <p className="text-[var(--color-ink-muted)]">
              Cap email a la whitelist. Afegeix el teu primer!
            </p>
          </Card>
        ) : (
          emails.map((item) => (
            <Card key={item.id} variant="default" padding="sm" hover={false}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[var(--color-ink)] truncate">
                    {item.email}
                  </p>
                  {item.note && (
                    <p className="text-sm text-[var(--color-ink-muted)] truncate">
                      {item.note}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleRemove(item.id)}
                  className="p-2 text-[var(--color-ink-muted)] hover:text-[var(--color-error)] hover:bg-[var(--color-error)]/10 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
