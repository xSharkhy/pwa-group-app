import { useState, useRef, useCallback } from 'react';
import { Button, Select } from '@/components/ui';
import { useTranslation } from '@/lib/i18n';
import { useImageProcessor } from '@/hooks/useImageProcessor';
import { usePhotoUpload } from '@/hooks/usePhotos';
import { uploadPhoto, uploadThumbnail } from '@/lib/storage';
import { useAuth } from '@/hooks/useAuth';
import exifr from 'exifr';
import type { Database } from '@/lib/database.types';

type Place = Database['public']['Tables']['places']['Row'];

interface PhotoUploaderProps {
  groupId: string;
  places: Place[];
  onSuccess: () => void;
  onCancel: () => void;
}

interface FileWithPreview {
  file: File;
  preview: string;
  processing: boolean;
  processed: boolean;
  error?: string;
}

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  // Calculate days to subtract to get to Saturday
  const diff = day === 6 ? 0 : day + 1;
  d.setDate(d.getDate() - diff);
  return d.toISOString().split('T')[0];
}

export function PhotoUploader({
  groupId,
  places,
  onSuccess,
  onCancel,
}: PhotoUploaderProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { processImage, terminate } = useImageProcessor();
  const { uploadPhoto: savePhotoRecord } = usePhotoUpload();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [placeId, setPlaceId] = useState('');
  const [consent, setConsent] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileSelect = useCallback(
    async (selectedFiles: FileList | null) => {
      if (!selectedFiles) return;

      const validTypes = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/heic',
        'image/heif',
      ];
      const maxSize = 8 * 1024 * 1024; // 8MB

      const newFiles: FileWithPreview[] = [];

      for (const file of Array.from(selectedFiles)) {
        // Validate type
        const isValidType =
          validTypes.includes(file.type) ||
          file.name.toLowerCase().endsWith('.heic') ||
          file.name.toLowerCase().endsWith('.heif');

        if (!isValidType) {
          continue;
        }

        // Validate size
        if (file.size > maxSize) {
          continue;
        }

        newFiles.push({
          file,
          preview: URL.createObjectURL(file),
          processing: false,
          processed: false,
        });
      }

      setFiles((prev) => [...prev, ...newFiles]);
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleUpload = async () => {
    if (!user || files.length === 0) return;

    try {
      setUploading(true);
      setProgress(0);

      const total = files.length;
      let completed = 0;

      for (const fileData of files) {
        try {
          // Process image
          const processed = await processImage(fileData.file);

          // Extract EXIF data
          let lat: number | null = null;
          let lng: number | null = null;
          let takenAt: Date | null = null;

          try {
            const exif = await exifr.parse(fileData.file, {
              gps: true,
              pick: ['DateTimeOriginal', 'GPSLatitude', 'GPSLongitude'],
            });

            if (exif) {
              if (exif.latitude && exif.longitude) {
                lat = exif.latitude;
                lng = exif.longitude;
              }
              if (exif.DateTimeOriginal) {
                takenAt = new Date(exif.DateTimeOriginal);
              }
            }
          } catch {
            // EXIF extraction failed, continue without it
          }

          // Upload main image
          const storagePath = await uploadPhoto(
            groupId,
            processed.main,
            'photo.webp'
          );

          // Upload thumbnail
          const thumbnailPath = await uploadThumbnail(
            groupId,
            processed.thumbnail,
            'thumb.webp'
          );

          // Calculate week start
          const photoDate = takenAt || new Date();
          const weekStart = getWeekStart(photoDate);

          // Save to database
          await savePhotoRecord({
            group_id: groupId,
            uploaded_by: user.id,
            storage_path: storagePath,
            thumbnail_path: thumbnailPath,
            original_filename: fileData.file.name,
            size_bytes: fileData.file.size,
            lat,
            lng,
            taken_at: takenAt?.toISOString() || null,
            week_start: weekStart,
            place_id: placeId || null,
            consent_given: consent,
          });

          completed++;
          setProgress(Math.round((completed / total) * 100));
        } catch (err) {
          console.error('Error uploading file:', err);
        }
      }

      terminate();
      onSuccess();
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const placeOptions = [
    { value: '', label: t('photos.upload.selectPlace') },
    ...places.map((p) => ({ value: p.id, label: p.name })),
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">
        {t('photos.upload.title')}
      </h2>

      {/* Drop zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p className="mt-2 text-sm text-gray-600">
          {t('photos.upload.dragDrop')}
        </p>
      </div>

      {/* Previews */}
      {files.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {files.map((fileData, index) => (
            <div key={index} className="relative aspect-square">
              <img
                src={fileData.preview}
                alt=""
                className="w-full h-full object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Options */}
      <Select
        label={t('photos.upload.associatePlace')}
        value={placeId}
        onChange={(e) => setPlaceId(e.target.value)}
        options={placeOptions}
      />

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        <span className="text-sm text-gray-700">
          {t('photos.upload.consent')}
        </span>
      </label>

      {/* Progress */}
      {uploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>{t('photos.upload.uploading')}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={uploading}
          className="flex-1"
        >
          {t('common.cancel')}
        </Button>
        <Button
          onClick={handleUpload}
          loading={uploading}
          disabled={files.length === 0}
          className="flex-1"
        >
          {t('photos.upload.submit', { count: files.length })}
        </Button>
      </div>
    </div>
  );
}
