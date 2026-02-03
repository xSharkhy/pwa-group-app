import { supabase } from './supabase';
import type { User, Session } from '@supabase/supabase-js';

export type AuthUser = User;
export type AuthSession = Session;

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) throw error;
  return data;
}

export async function signInWithSpotify() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'spotify',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) throw error;
  return data;
}

export async function signInWithMagicLink(email: string) {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function getUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

export function onAuthStateChange(callback: (session: Session | null) => void) {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });

  return subscription;
}

export async function getProfile(userId: string) {
  // Only select needed columns to avoid over-fetching
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, display_name, avatar_url, locale_preference, created_at')
    .eq('id', userId)
    .maybeSingle();

  // If no profile found, return null instead of throwing
  if (error && error.code !== 'PGRST116') {
    console.error('getProfile error:', error);
    throw error;
  }
  return data;
}

export async function updateProfile(
  userId: string,
  updates: {
    display_name?: string;
    avatar_url?: string | null;
    locale_preference?: 'ca' | 'gl';
  }
) {
  // Only return needed columns
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select('id, email, display_name, avatar_url, locale_preference, created_at')
    .single();

  if (error) throw error;
  return data;
}

export async function upsertProfile(
  userId: string,
  email: string,
  updates: {
    display_name: string;
    avatar_url?: string | null;
    locale_preference?: 'ca' | 'gl';
  }
) {
  // Only return needed columns
  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      email: email,
      display_name: updates.display_name,
      avatar_url: updates.avatar_url || null,
      locale_preference: updates.locale_preference || 'ca',
    }, {
      onConflict: 'id',
    })
    .select('id, email, display_name, avatar_url, locale_preference, created_at')
    .single();

  if (error) {
    console.error('upsertProfile error:', error);
    throw error;
  }
  return data;
}

export async function checkProfileExists(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') throw error;
  return data !== null;
}
