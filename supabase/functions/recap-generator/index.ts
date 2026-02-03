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
  place_id: string | null;
}

interface MeetupCandidate {
  photos: Photo[];
  lat: number;
  lng: number;
  detected_at: string;
  users: string[];
  place_id: string | null;
}

interface ProcessingResult {
  groupId: string;
  groupName: string;
  success: boolean;
  photosCount: number;
  meetupsCount: number;
  error?: string;
}

// Configuration
const CONFIG = {
  MAX_DISTANCE_METERS: 100,
  MAX_TIME_DIFF_HOURS: 2,
  MIN_USERS_FOR_MEETUP: 2,
  MAX_PHOTOS_FOR_CLUSTERING: 500, // Limit to prevent timeout
};

// Haversine distance in meters - optimized with early exit
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  maxDistance: number = CONFIG.MAX_DISTANCE_METERS
): number | null {
  // Quick bounding box check first (much faster than trig)
  // 1 degree latitude ≈ 111km, 1 degree longitude ≈ 111km * cos(lat)
  const latDiff = Math.abs(lat2 - lat1) * 111000;
  const lonDiff = Math.abs(lon2 - lon1) * 111000 * Math.cos((lat1 * Math.PI) / 180);

  // If bounding box is larger than max distance, skip expensive calculation
  if (latDiff > maxDistance || lonDiff > maxDistance) {
    return null;
  }

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
  const distance = R * c;

  return distance <= maxDistance ? distance : null;
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

// Optimized meetup detection with early exits
function detectMeetups(photos: Photo[]): MeetupCandidate[] {
  const candidates: MeetupCandidate[] = [];
  const processed = new Set<string>();

  // Only consider photos with coordinates
  const geoPhotos = photos.filter((p) => p.lat !== null && p.lng !== null);

  // Limit photos to prevent O(n²) timeout
  if (geoPhotos.length > CONFIG.MAX_PHOTOS_FOR_CLUSTERING) {
    console.warn(
      `Too many geo-tagged photos (${geoPhotos.length}), sampling first ${CONFIG.MAX_PHOTOS_FOR_CLUSTERING}`
    );
    geoPhotos.length = CONFIG.MAX_PHOTOS_FOR_CLUSTERING;
  }

  // Sort by time for more efficient clustering
  geoPhotos.sort((a, b) => {
    const timeA = new Date(a.taken_at || a.created_at).getTime();
    const timeB = new Date(b.taken_at || b.created_at).getTime();
    return timeA - timeB;
  });

  const maxTimeDiffMs = CONFIG.MAX_TIME_DIFF_HOURS * 60 * 60 * 1000;

  for (let i = 0; i < geoPhotos.length; i++) {
    const photo = geoPhotos[i];
    if (processed.has(photo.id)) continue;

    const cluster: Photo[] = [photo];
    processed.add(photo.id);

    const photoTime = new Date(photo.taken_at || photo.created_at).getTime();

    // Only check photos within time window (since sorted by time)
    for (let j = i + 1; j < geoPhotos.length; j++) {
      const other = geoPhotos[j];
      if (processed.has(other.id)) continue;

      const otherTime = new Date(other.taken_at || other.created_at).getTime();
      const timeDiff = otherTime - photoTime;

      // Since sorted, if time diff exceeds window, all subsequent will too
      if (timeDiff > maxTimeDiffMs) break;

      const distance = haversineDistance(
        photo.lat!,
        photo.lng!,
        other.lat!,
        other.lng!
      );

      // Within distance threshold (null means outside)
      if (distance !== null) {
        cluster.push(other);
        processed.add(other.id);
      }
    }

    // Only consider as meetup if 2+ different users
    const userIds = [...new Set(cluster.map((p) => p.uploaded_by))];
    if (userIds.length >= CONFIG.MIN_USERS_FOR_MEETUP) {
      // Calculate centroid
      const avgLat = cluster.reduce((sum, p) => sum + p.lat!, 0) / cluster.length;
      const avgLng = cluster.reduce((sum, p) => sum + p.lng!, 0) / cluster.length;

      // Use earliest photo time as detected_at
      const times = cluster.map((p) => new Date(p.taken_at || p.created_at).getTime());
      const detectedAt = new Date(Math.min(...times)).toISOString();

      // Get place_id if photos are associated with a place
      const placeIds = cluster.map((p) => p.place_id).filter(Boolean);
      const mostCommonPlaceId = placeIds.length > 0
        ? placeIds.sort((a, b) =>
            placeIds.filter((v) => v === a).length - placeIds.filter((v) => v === b).length
          ).pop() || null
        : null;

      candidates.push({
        photos: cluster,
        lat: avgLat,
        lng: avgLng,
        detected_at: detectedAt,
        users: userIds,
        place_id: mostCommonPlaceId,
      });
    }
  }

  return candidates;
}

// Process a single group with error handling
async function processGroup(
  supabase: ReturnType<typeof createClient>,
  group: { id: string; name: string },
  weekStart: string,
  weekEnd: string,
  now: Date
): Promise<ProcessingResult> {
  const result: ProcessingResult = {
    groupId: group.id,
    groupName: group.name,
    success: false,
    photosCount: 0,
    meetupsCount: 0,
  };

  try {
    // Get photos for this week - only fetch needed columns
    const { data: photos, error: photosError } = await supabase
      .from('photos')
      .select('id, uploaded_by, lat, lng, taken_at, created_at, place_id')
      .eq('group_id', group.id)
      .eq('week_start', weekStart);

    if (photosError) {
      result.error = `Failed to fetch photos: ${photosError.message}`;
      return result;
    }

    if (!photos || photos.length === 0) {
      console.log(`No photos for group ${group.id}, creating empty recap`);
    }

    result.photosCount = photos?.length || 0;

    // Detect meetups
    const meetups = detectMeetups(photos || []);
    result.meetupsCount = meetups.length;

    // Get contributors with profile info
    const contributorIds = [...new Set((photos || []).map((p) => p.uploaded_by))];

    // Fetch contributor profiles in single query
    let contributors: Array<{
      id: string;
      display_name: string;
      avatar_url: string | null;
      photos_count: number;
    }> = [];

    if (contributorIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', contributorIds);

      contributors = (profiles || []).map((p) => ({
        id: p.id,
        display_name: p.display_name,
        avatar_url: p.avatar_url,
        photos_count: (photos || []).filter((photo) => photo.uploaded_by === p.id).length,
      }));
    }

    // Build summary
    const summary = {
      photos_count: result.photosCount,
      places_count: [...new Set((photos || []).map((p) => p.place_id).filter(Boolean))].length,
      contributors,
      meetups_count: meetups.length,
      top_photos: (photos || []).slice(0, 6).map((p) => p.id),
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
      .select('id')
      .single();

    if (recapError) {
      result.error = `Failed to create recap: ${recapError.message}`;
      return result;
    }

    // Delete existing meetups for this recap (idempotency)
    await supabase.from('meetups').delete().eq('recap_id', recap.id);

    // Create meetup records with participants in batch
    for (const meetup of meetups) {
      const { data: meetupRecord, error: meetupError } = await supabase
        .from('meetups')
        .insert({
          recap_id: recap.id,
          detected_at: meetup.detected_at,
          lat: meetup.lat,
          lng: meetup.lng,
          place_id: meetup.place_id,
          is_confirmed: false,
        })
        .select('id')
        .single();

      if (meetupError) {
        console.error(`Failed to create meetup: ${meetupError.message}`);
        continue; // Skip this meetup but continue with others
      }

      // Batch insert participants with ON CONFLICT DO NOTHING
      const participants = meetup.users.map((userId) => ({
        meetup_id: meetupRecord.id,
        user_id: userId,
        confirmed: false,
      }));

      const { error: participantsError } = await supabase
        .from('meetup_participants')
        .upsert(participants, {
          onConflict: 'meetup_id,user_id',
          ignoreDuplicates: true,
        });

      if (participantsError) {
        console.error(`Failed to add participants: ${participantsError.message}`);
      }
    }

    result.success = true;
    console.log(
      `Recap generated for ${group.name}: ${result.photosCount} photos, ${result.meetupsCount} meetups`
    );

    return result;
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error processing group ${group.name}:`, error);
    return result;
  }
}

serve(async (req) => {
  const startTime = Date.now();

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

    if (groupsError) {
      throw new Error(`Failed to fetch groups: ${groupsError.message}`);
    }

    if (!groups || groups.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No groups to process',
          duration_ms: Date.now() - startTime,
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Process all groups (continuing even if some fail)
    const results: ProcessingResult[] = [];

    for (const group of groups) {
      const result = await processGroup(supabase, group, weekStart, weekEnd, now);
      results.push(result);
    }

    // Summary statistics
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;
    const totalPhotos = results.reduce((sum, r) => sum + r.photosCount, 0);
    const totalMeetups = results.reduce((sum, r) => sum + r.meetupsCount, 0);

    const response = {
      success: failed === 0,
      summary: {
        groups_processed: groups.length,
        successful,
        failed,
        total_photos: totalPhotos,
        total_meetups: totalMeetups,
        duration_ms: Date.now() - startTime,
      },
      results: results.map((r) => ({
        group: r.groupName,
        success: r.success,
        photos: r.photosCount,
        meetups: r.meetupsCount,
        error: r.error,
      })),
    };

    console.log(`Recap generation complete: ${successful}/${groups.length} groups successful`);

    return new Response(JSON.stringify(response), {
      status: failed > 0 ? 207 : 200, // 207 Multi-Status if partial failure
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Fatal error generating recaps:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration_ms: Date.now() - startTime,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
