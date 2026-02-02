import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface Photo {
  id: string;
  uploaded_by: string;
  lat: number | null;
  lng: number | null;
  taken_at: string | null;
  created_at: string;
}

interface MeetupCandidate {
  photos: Photo[];
  lat: number;
  lng: number;
  detected_at: string;
  users: Set<string>;
}

// Haversine distance in meters
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Get Saturday of the week for a given date
function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 6 ? 0 : day + 1;
  d.setDate(d.getDate() - diff);
  return d.toISOString().split('T')[0];
}

// Get Friday (end of week)
function getWeekEnd(weekStart: string): string {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 6);
  return d.toISOString().split('T')[0];
}

// Cluster photos by location and time
function detectMeetups(photos: Photo[]): MeetupCandidate[] {
  const candidates: MeetupCandidate[] = [];
  const processed = new Set<string>();

  // Only consider photos with coordinates
  const geoPhotos = photos.filter((p) => p.lat !== null && p.lng !== null);

  for (const photo of geoPhotos) {
    if (processed.has(photo.id)) continue;

    const cluster: Photo[] = [photo];
    processed.add(photo.id);

    const photoTime = new Date(photo.taken_at || photo.created_at).getTime();

    for (const other of geoPhotos) {
      if (processed.has(other.id)) continue;

      const otherTime = new Date(other.taken_at || other.created_at).getTime();
      const timeDiff = Math.abs(photoTime - otherTime);

      // Within 2 hours
      if (timeDiff > 2 * 60 * 60 * 1000) continue;

      const distance = haversineDistance(
        photo.lat!,
        photo.lng!,
        other.lat!,
        other.lng!
      );

      // Within 100 meters
      if (distance <= 100) {
        cluster.push(other);
        processed.add(other.id);
      }
    }

    // Only consider as meetup if 2+ different users
    const users = new Set(cluster.map((p) => p.uploaded_by));
    if (users.size >= 2) {
      // Calculate centroid
      const avgLat =
        cluster.reduce((sum, p) => sum + p.lat!, 0) / cluster.length;
      const avgLng =
        cluster.reduce((sum, p) => sum + p.lng!, 0) / cluster.length;

      // Use earliest photo time as detected_at
      const times = cluster.map((p) =>
        new Date(p.taken_at || p.created_at).getTime()
      );
      const detectedAt = new Date(Math.min(...times)).toISOString();

      candidates.push({
        photos: cluster,
        lat: avgLat,
        lng: avgLng,
        detected_at: detectedAt,
        users,
      });
    }
  }

  return candidates;
}

serve(async (req) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate week dates
    const now = new Date();
    const weekStart = getWeekStart(now);
    const weekEnd = getWeekEnd(weekStart);

    console.log(`Generating recaps for week ${weekStart} to ${weekEnd}`);

    // Get all active groups
    const { data: groups, error: groupsError } = await supabase
      .from('groups')
      .select('id, name');

    if (groupsError) throw groupsError;

    for (const group of groups || []) {
      console.log(`Processing group: ${group.name} (${group.id})`);

      // Get photos for this week
      const { data: photos, error: photosError } = await supabase
        .from('photos')
        .select('*')
        .eq('group_id', group.id)
        .eq('week_start', weekStart);

      if (photosError) throw photosError;

      if (!photos || photos.length === 0) {
        console.log(`No photos for group ${group.id}, skipping`);
        continue;
      }

      // Detect meetups
      const meetups = detectMeetups(photos);

      // Get contributors
      const contributors = [...new Set(photos.map((p) => p.uploaded_by))];

      // Build summary
      const summary = {
        photos_count: photos.length,
        contributors: contributors,
        contributors_count: contributors.length,
        meetups_count: meetups.length,
        top_photos: photos.slice(0, 6).map((p) => p.id),
      };

      // Upsert weekly recap
      const { data: recap, error: recapError } = await supabase
        .from('weekly_recaps')
        .upsert(
          {
            group_id: group.id,
            week_start: weekStart,
            week_end: weekEnd,
            generated_at: now.toISOString(),
            published: true,
            summary,
          },
          { onConflict: 'group_id,week_start' }
        )
        .select()
        .single();

      if (recapError) throw recapError;

      // Create meetup records
      for (const meetup of meetups) {
        const { data: meetupRecord, error: meetupError } = await supabase
          .from('meetups')
          .insert({
            recap_id: recap.id,
            detected_at: meetup.detected_at,
            lat: meetup.lat,
            lng: meetup.lng,
            is_confirmed: false,
          })
          .select()
          .single();

        if (meetupError) throw meetupError;

        // Add participants
        for (const userId of meetup.users) {
          await supabase.from('meetup_participants').insert({
            meetup_id: meetupRecord.id,
            user_id: userId,
            confirmed: false,
          });
        }
      }

      console.log(
        `Recap generated for ${group.name}: ${photos.length} photos, ${meetups.length} meetups`
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating recaps:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
