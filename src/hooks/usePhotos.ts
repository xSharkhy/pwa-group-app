import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

type Photo = Database['public']['Tables']['photos']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

interface PhotoWithUploader extends Photo {
  uploader?: Profile | null;
}

export function usePhotos(
  groupId: string | undefined,
  filters?: {
    weekStart?: string;
    placeId?: string;
    userId?: string;
  }
) {
  const [photos, setPhotos] = useState<PhotoWithUploader[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId) {
      setPhotos([]);
      setLoading(false);
      return;
    }

    async function fetchPhotos() {
      setLoading(true);

      let query = supabase
        .from('photos')
        .select(
          `
          *,
          uploader:profiles!photos_uploaded_by_fkey(*)
        `
        )
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });

      if (filters?.weekStart) {
        query = query.eq('week_start', filters.weekStart);
      }

      if (filters?.placeId) {
        query = query.eq('place_id', filters.placeId);
      }

      if (filters?.userId) {
        query = query.eq('uploaded_by', filters.userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching photos:', error);
        setLoading(false);
        return;
      }

      setPhotos(data ?? []);
      setLoading(false);
    }

    fetchPhotos();

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`photos:${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'photos',
          filter: `group_id=eq.${groupId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data: newPhoto } = await supabase
              .from('photos')
              .select('*, uploader:profiles!photos_uploaded_by_fkey(*)')
              .eq('id', payload.new.id)
              .single();

            if (newPhoto) {
              setPhotos((prev) => [newPhoto, ...prev]);
            }
          } else if (payload.eventType === 'DELETE') {
            setPhotos((prev) => prev.filter((p) => p.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, filters?.weekStart, filters?.placeId, filters?.userId]);

  const deletePhoto = useCallback(async (id: string) => {
    const { error } = await supabase.from('photos').delete().eq('id', id);
    if (error) throw error;
  }, []);

  return {
    photos,
    loading,
    deletePhoto,
  };
}

export function usePhotoUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadPhoto = useCallback(
    async (
      photo: Omit<
        Database['public']['Tables']['photos']['Insert'],
        'id' | 'created_at'
      >
    ) => {
      const { data, error } = await supabase
        .from('photos')
        .insert(photo)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    []
  );

  return {
    uploadPhoto,
    uploading,
    setUploading,
    progress,
    setProgress,
  };
}
