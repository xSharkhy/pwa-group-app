import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (_req) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Delete expired and unused invites
    const { data, error } = await supabase
      .from('group_invites')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .is('used_at', null)
      .select('id');

    if (error) throw error;

    const deletedCount = data?.length || 0;
    console.log(`Cleaned up ${deletedCount} expired invites`);

    return new Response(
      JSON.stringify({ success: true, deleted: deletedCount }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error cleaning up invites:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
