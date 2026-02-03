import { useEffect, useMemo } from 'react';
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

      // Only fetch needed columns, not all group fields
      const { data, error } = await supabase
        .from('group_members')
        .select(
          `
          role,
          group:groups(id, name, description, owner_id, max_members, created_at)
        `
        )
        .eq('user_id', user!.id);

      if (error) {
        console.error('Error fetching groups:', error);
        setLoading(false);
        return;
      }

      const groups = data
        ?.map((item: any) => ({
          ...item.group,
          userRole: item.role, // Include user's role in this group
        }))
        .filter((g: any) => g !== null && g.id) || [];

      setGroups(groups as any);
      setLoading(false);
    }

    fetchGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      // Only fetch needed columns to reduce payload
      const { data, error } = await supabase
        .from('groups')
        .select(
          `
          id, name, description, owner_id, max_members, created_at,
          members:group_members(
            id, user_id, role, joined_at,
            profile:profiles(id, display_name, avatar_url)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, user?.id]);

  // Memoize isAdmin calculation to avoid recalculating on every render
  const isAdmin = useMemo(() => {
    if (!currentGroup || !user) return false;

    // Check if user is owner
    if (currentGroup.owner_id === user.id) return true;

    // Check if user has admin role
    return currentGroup.members?.some(
      (m) => m.user_id === user.id && m.role === 'admin'
    ) ?? false;
  }, [currentGroup?.id, currentGroup?.owner_id, currentGroup?.members, user?.id]);

  return {
    group: currentGroup,
    loading,
    isAdmin,
  };
}
