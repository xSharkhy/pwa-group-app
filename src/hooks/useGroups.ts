import { useEffect } from 'react';
import { useGroupsStore } from '@/stores/groups';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export function useGroups() {
  const { user } = useAuth();
  const { groups, loading, setGroups, setLoading, addGroup, removeGroup } =
    useGroupsStore();

  useEffect(() => {
    if (!user) {
      setGroups([]);
      setLoading(false);
      return;
    }

    async function fetchGroups() {
      setLoading(true);

      const { data, error } = await supabase
        .from('group_members')
        .select(
          `
          group:groups(*)
        `
        )
        .eq('user_id', user!.id);

      if (error) {
        console.error('Error fetching groups:', error);
        setLoading(false);
        return;
      }

      const groups = data
        ?.map((item: any) => item.group)
        .filter((g: any) => g !== null) || [];

      setGroups(groups as any);
      setLoading(false);
    }

    fetchGroups();
  }, [user?.id]);

  return {
    groups,
    loading,
    addGroup,
    removeGroup,
  };
}

export function useGroup(groupId: string | undefined) {
  const { currentGroup, setCurrentGroup, loading, setLoading } =
    useGroupsStore();
  const { user } = useAuth();

  useEffect(() => {
    if (!groupId || !user) {
      setCurrentGroup(null);
      return;
    }

    async function fetchGroup() {
      setLoading(true);

      const { data, error } = await supabase
        .from('groups')
        .select(
          `
          *,
          members:group_members(
            *,
            profile:profiles(*)
          )
        `
        )
        .eq('id', groupId)
        .single();

      if (error) {
        console.error('Error fetching group:', error);
        setLoading(false);
        return;
      }

      setCurrentGroup(data);
      setLoading(false);
    }

    fetchGroup();
  }, [groupId, user?.id]);

  return {
    group: currentGroup,
    loading,
    isAdmin:
      currentGroup?.owner_id === user?.id ||
      currentGroup?.members?.some(
        (m) => m.user_id === user?.id && m.role === 'admin'
      ),
  };
}
