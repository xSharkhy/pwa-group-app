import { supabase } from './supabase';

const PHOTOS_BUCKET = 'photos';
const AVATARS_BUCKET = 'avatars';

export async function uploadPhoto(
  groupId: string,
  file: Blob,
  filename: string
): Promise<string> {
  const path = `${groupId}/${crypto.randomUUID()}-${filename}`;

  const { error } = await supabase.storage
    .from(PHOTOS_BUCKET)
    .upload(path, file, {
      contentType: file.type,
      cacheControl: '31536000', // 1 year
    });

  if (error) throw error;
  return path;
}

export async function uploadThumbnail(
  groupId: string,
  file: Blob,
  filename: string
): Promise<string> {
  const path = `${groupId}/thumbs/${crypto.randomUUID()}-${filename}`;

  const { error } = await supabase.storage
    .from(PHOTOS_BUCKET)
    .upload(path, file, {
      contentType: file.type,
      cacheControl: '31536000',
    });

  if (error) throw error;
  return path;
}

export async function uploadAvatar(
  userId: string,
  file: Blob,
  filename: string
): Promise<string> {
  const path = `${userId}/${crypto.randomUUID()}-${filename}`;

  const { error } = await supabase.storage
    .from(AVATARS_BUCKET)
    .upload(path, file, {
      contentType: file.type,
      cacheControl: '31536000',
      upsert: true,
    });

  if (error) throw error;
  return getAvatarUrl(path);
}

export function getPhotoUrl(path: string): string {
  const { data } = supabase.storage.from(PHOTOS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export function getAvatarUrl(path: string): string {
  const { data } = supabase.storage.from(AVATARS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function deletePhoto(path: string): Promise<void> {
  const { error } = await supabase.storage.from(PHOTOS_BUCKET).remove([path]);
  if (error) throw error;
}

export async function deleteAvatar(path: string): Promise<void> {
  const { error } = await supabase.storage.from(AVATARS_BUCKET).remove([path]);
  if (error) throw error;
}

export function getSignedPhotoUrl(
  path: string,
  expiresIn: number = 3600
): Promise<string> {
  return supabase.storage
    .from(PHOTOS_BUCKET)
    .createSignedUrl(path, expiresIn)
    .then(({ data, error }) => {
      if (error) throw error;
      return data.signedUrl;
    });
}
