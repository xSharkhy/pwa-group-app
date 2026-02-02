import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

type Place = Database['public']['Tables']['places']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

interface PlaceWithCategory extends Place {
  category?: Category | null;
}

export function usePlaces(groupId: string | undefined) {
  const [places, setPlaces] = useState<PlaceWithCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId) {
      setPlaces([]);
      setLoading(false);
      return;
    }

    async function fetchPlaces() {
      setLoading(true);

      const { data, error } = await supabase
        .from('places')
        .select(
          `
          *,
          category:categories(*)
        `
        )
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching places:', error);
        setLoading(false);
        return;
      }

      setPlaces(data ?? []);
      setLoading(false);
    }

    fetchPlaces();

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`places:${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'places',
          filter: `group_id=eq.${groupId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data: newPlace } = await supabase
              .from('places')
              .select('*, category:categories(*)')
              .eq('id', payload.new.id)
              .single();

            if (newPlace) {
              setPlaces((prev) => [newPlace, ...prev]);
            }
          } else if (payload.eventType === 'UPDATE') {
            const { data: updatedPlace } = await supabase
              .from('places')
              .select('*, category:categories(*)')
              .eq('id', payload.new.id)
              .single();

            if (updatedPlace) {
              setPlaces((prev) =>
                prev.map((p) => (p.id === updatedPlace.id ? updatedPlace : p))
              );
            }
          } else if (payload.eventType === 'DELETE') {
            setPlaces((prev) => prev.filter((p) => p.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId]);

  const addPlace = useCallback(
    async (
      place: Omit<
        Database['public']['Tables']['places']['Insert'],
        'id' | 'created_at' | 'updated_at'
      >
    ) => {
      const { data, error } = await supabase
        .from('places')
        .insert(place)
        .select('*, category:categories(*)')
        .single();

      if (error) throw error;
      return data;
    },
    []
  );

  const updatePlace = useCallback(
    async (
      id: string,
      updates: Database['public']['Tables']['places']['Update']
    ) => {
      const { data, error } = await supabase
        .from('places')
        .update(updates)
        .eq('id', id)
        .select('*, category:categories(*)')
        .single();

      if (error) throw error;
      return data;
    },
    []
  );

  const deletePlace = useCallback(async (id: string) => {
    const { error } = await supabase.from('places').delete().eq('id', id);

    if (error) throw error;
  }, []);

  return {
    places,
    loading,
    addPlace,
    updatePlace,
    deletePlace,
  };
}

export function usePlace(placeId: string | undefined) {
  const [place, setPlace] = useState<PlaceWithCategory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!placeId) {
      setPlace(null);
      setLoading(false);
      return;
    }

    async function fetchPlace() {
      setLoading(true);

      const { data, error } = await supabase
        .from('places')
        .select(
          `
          *,
          category:categories(*),
          created_by_profile:profiles!places_created_by_fkey(*)
        `
        )
        .eq('id', placeId)
        .single();

      if (error) {
        console.error('Error fetching place:', error);
        setLoading(false);
        return;
      }

      setPlace(data);
      setLoading(false);
    }

    fetchPlace();
  }, [placeId]);

  return { place, loading };
}
