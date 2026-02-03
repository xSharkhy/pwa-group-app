import { supabase } from './supabase';

const PHOTOS_BUCKET = 'photos';
const AVATARS_BUCKET = 'avatars';

// Maximum file sizes
const MAX_PHOTO_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB

// Allowed MIME types with their magic bytes signatures
const ALLOWED_IMAGE_TYPES = {
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/png': [0x89, 0x50, 0x4E, 0x47],
  'image/webp': [0x52, 0x49, 0x46, 0x46], // RIFF header
  'image/heic': [0x00, 0x00, 0x00], // ftyp box (needs special handling)
  'image/heif': [0x00, 0x00, 0x00],
} as const;

type AllowedMimeType = keyof typeof ALLOWED_IMAGE_TYPES;

/**
 * Validates file type by checking magic bytes (file signature)
 * This prevents MIME type spoofing attacks
 */
async function validateFileType(file: Blob): Promise<AllowedMimeType> {
  const header = await file.slice(0, 12).arrayBuffer();
  const bytes = new Uint8Array(header);

  // Check JPEG
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
    return 'image/jpeg';
  }

  // Check PNG
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
    return 'image/png';
  }

  // Check WebP (RIFF....WEBP)
  if (
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return 'image/webp';
  }

  // Check HEIC/HEIF (ftyp box at offset 4)
  if (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) {
    // Check for heic/heif/mif1 brand
    const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
    if (brand === 'heic' || brand === 'heix' || brand === 'mif1') {
      return 'image/heic';
    }
  }

  throw new Error('Invalid file type. Allowed: JPEG, PNG, WebP, HEIC');
}

/**
 * Validates file size
 */
function validateFileSize(file: Blob, maxSize: number): void {
  if (file.size > maxSize) {
    const maxMB = Math.round(maxSize / 1024 / 1024);
    throw new Error(`File too large. Maximum size: ${maxMB}MB`);
  }
}

/**
 * Sanitizes filename to prevent path traversal attacks
 */
function sanitizeFilename(filename: string): string {
  // Remove path separators and null bytes
  return filename
    .replace(/[/\\]/g, '_')
    .replace(/\0/g, '')
    .replace(/\.\./g, '_')
    .slice(0, 100); // Limit length
}

export async function uploadPhoto(
  groupId: string,
  file: Blob,
  filename: string
): Promise<string> {
  // Validate file size
  validateFileSize(file, MAX_PHOTO_SIZE);

  // Validate and get actual MIME type from magic bytes
  const validatedType = await validateFileType(file);

  // Sanitize filename
  const safeFilename = sanitizeFilename(filename);
  const path = `${groupId}/${crypto.randomUUID()}-${safeFilename}`;

  const { error } = await supabase.storage
    .from(PHOTOS_BUCKET)
    .upload(path, file, {
      contentType: validatedType, // Use validated type, not client-provided
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
  // Thumbnails are smaller, use reduced limit
  validateFileSize(file, MAX_PHOTO_SIZE / 4);

  const validatedType = await validateFileType(file);
  const safeFilename = sanitizeFilename(filename);
  const path = `${groupId}/thumbs/${crypto.randomUUID()}-${safeFilename}`;

  const { error } = await supabase.storage
    .from(PHOTOS_BUCKET)
    .upload(path, file, {
      contentType: validatedType,
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
  // Validate file size (smaller limit for avatars)
  validateFileSize(file, MAX_AVATAR_SIZE);

  // Validate file type
  const validatedType = await validateFileType(file);

  const safeFilename = sanitizeFilename(filename);
  const path = `${userId}/${crypto.randomUUID()}-${safeFilename}`;

  const { error } = await supabase.storage
    .from(AVATARS_BUCKET)
    .upload(path, file, {
      contentType: validatedType,
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

/**
 * Deletes photo and its associated thumbnail
 * Call this instead of deletePhoto when deleting user photos
 */
export async function deletePhotoWithThumbnail(
  photoPath: string,
  thumbnailPath: string
): Promise<void> {
  // Delete both in parallel
  const [photoResult, thumbResult] = await Promise.all([
    supabase.storage.from(PHOTOS_BUCKET).remove([photoPath]),
    supabase.storage.from(PHOTOS_BUCKET).remove([thumbnailPath]),
  ]);

  if (photoResult.error) throw photoResult.error;
  // Thumbnail deletion failure is non-critical, log but don't throw
  if (thumbResult.error) {
    console.warn('Failed to delete thumbnail:', thumbResult.error);
  }
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
