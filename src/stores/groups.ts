import { create } from 'zustand';
import type { Database } from '@/lib/database.types';

type Group = Database['public']['Tables']['groups']['Row'];
type GroupMember = Database['public']['Tables']['group_members']['Row'];

interface GroupWithMembers extends Group {
  members?: GroupMember[];
}

interface GroupsState {
  groups: GroupWithMembers[];
  currentGroup: GroupWithMembers | null;
  loading: boolean;
  setGroups: (groups: GroupWithMembers[]) => void;
  setCurrentGroup: (group: GroupWithMembers | null) => void;
  addGroup: (group: GroupWithMembers) => void;
  updateGroup: (id: string, updates: Partial<Group>) => void;
  removeGroup: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useGroupsStore = create<GroupsState>((set) => ({
  groups: [],
  currentGroup: null,
  loading: true,
  setGroups: (groups) => set({ groups }),
  setCurrentGroup: (currentGroup) => set({ currentGroup }),
  addGroup: (group) =>
    set((state) => ({ groups: [...state.groups, group] })),
  updateGroup: (id, updates) =>
    set((state) => ({
      groups: state.groups.map((g) =>
        g.id === id ? { ...g, ...updates } : g
      ),
      currentGroup:
        state.currentGroup?.id === id
          ? { ...state.currentGroup, ...updates }
          : state.currentGroup,
    })),
  removeGroup: (id) =>
    set((state) => ({
      groups: state.groups.filter((g) => g.id !== id),
      currentGroup:
        state.currentGroup?.id === id ? null : state.currentGroup,
    })),
  setLoading: (loading) => set({ loading }),
}));
