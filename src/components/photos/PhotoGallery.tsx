import { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { getPhotoUrl } from '@/lib/storage';
import { PhotoLightbox } from './PhotoLightbox';
import type { Database } from '@/lib/database.types';

type Photo = Database['public']['Tables']['photos']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

interface PhotoWithUploader extends Photo {
  uploader?: Profile | null;
}

interface PhotoGalleryProps {
  photos: PhotoWithUploader[];
  onDelete?: (id: string) => void;
  currentUserId?: string;
}

export function PhotoGallery({
  photos,
  onDelete,
  currentUserId,
}: PhotoGalleryProps) {
  const { t } = useTranslation();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (photos.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          {t('photos.empty.title')}
        </h2>
        <p className="text-gray-600">{t('photos.empty.subtitle')}</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className="relative aspect-square cursor-pointer group"
            onClick={() => setSelectedIndex(index)}
          >
            <img
              src={getPhotoUrl(photo.thumbnail_path)}
              alt=""
              loading="lazy"
              className="w-full h-full object-cover rounded-lg"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg" />
            {photo.uploader && (
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-xs text-white truncate">
                  {photo.uploader.display_name}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedIndex !== null && (
        <PhotoLightbox
          photos={photos}
          initialIndex={selectedIndex}
          onClose={() => setSelectedIndex(null)}
          onDelete={
            onDelete && currentUserId
              ? (id) => {
                  const photo = photos.find((p) => p.id === id);
                  if (photo?.uploaded_by === currentUserId) {
                    onDelete(id);
                  }
                }
              : undefined
          }
          currentUserId={currentUserId}
        />
      )}
    </>
  );
}
