import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!;
const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')!;
const vapidSubject = Deno.env.get('VAPID_SUBJECT')!;

interface PushSubscription {
  user_id: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface ReminderMessage {
  locale: string;
  title: string;
  body: string;
  time_window: string;
}

// Get random time within a window
function getRandomTimeInWindow(
  window: 'morning' | 'afternoon' | 'night'
): number {
  const ranges = {
    morning: { start: 6, end: 14 },
    afternoon: { start: 14, end: 22 },
    night: { start: 22, end: 6 }, // wraps around midnight
  };

  const range = ranges[window];
  const hours = range.start + Math.random() * (range.end - range.start);
  return Math.floor(hours * 60); // Return minutes from midnight
}

serve(async (_req) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all users with push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('user_id, endpoint, keys')
      .not('endpoint', 'is', null);

    if (subError) throw subError;

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No push subscriptions found');
      return new Response(JSON.stringify({ success: true, scheduled: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get user profiles for locale
    const userIds = [...new Set(subscriptions.map((s) => s.user_id))];
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, locale_preference')
      .in('id', userIds);

    if (profileError) throw profileError;

    const localeMap = new Map(
      profiles?.map((p) => [p.id, p.locale_preference]) || []
    );

    // Get reminder messages
    const { data: messages, error: msgError } = await supabase
      .from('reminder_messages')
      .select('*');

    if (msgError) throw msgError;

    const messagesByLocaleAndWindow = new Map<string, ReminderMessage[]>();
    for (const msg of messages || []) {
      const key = `${msg.locale}:${msg.time_window}`;
      if (!messagesByLocaleAndWindow.has(key)) {
        messagesByLocaleAndWindow.set(key, []);
      }
      messagesByLocaleAndWindow.get(key)!.push(msg);
    }

    // Schedule 3 notifications per user
    const windows: ('morning' | 'afternoon' | 'night')[] = [
      'morning',
      'afternoon',
      'night',
    ];
    let scheduledCount = 0;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    for (const sub of subscriptions) {
      const locale = localeMap.get(sub.user_id) || 'ca';

      for (const window of windows) {
        const key = `${locale}:${window}`;
        const windowMessages = messagesByLocaleAndWindow.get(key);

        if (!windowMessages || windowMessages.length === 0) continue;

        // Pick random message
        const message =
          windowMessages[Math.floor(Math.random() * windowMessages.length)];

        // Calculate scheduled time
        const minutes = getRandomTimeInWindow(window);
        const scheduledAt = new Date(today);
        scheduledAt.setMinutes(minutes);

        // If time already passed today, skip (cron runs at midnight)
        if (scheduledAt <= now) continue;

        // Create notification record
        await supabase.from('notifications').insert({
          user_id: sub.user_id,
          type: 'reminder',
          title: message.title,
          body: message.body,
          payload: {
            scheduled_at: scheduledAt.toISOString(),
            endpoint: sub.endpoint,
            keys: sub.keys,
          },
        });

        scheduledCount++;
      }
    }

    console.log(`Scheduled ${scheduledCount} push notifications`);

    return new Response(
      JSON.stringify({ success: true, scheduled: scheduledCount }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error scheduling push notifications:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
