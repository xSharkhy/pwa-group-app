import { useState, useRef } from 'react';
import { Button, Input, Select } from '@/components/ui';
import { useTranslation } from '@/lib/i18n';
import { updateProfile } from '@/lib/auth';
import { uploadAvatar } from '@/lib/storage';
import { useAuth } from '@/hooks/useAuth';

interface ProfileSetupFormProps {
  onComplete: () => void;
}

export function ProfileSetupForm({ onComplete }: ProfileSetupFormProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState('');
  const [locale, setLocale] = useState<'ca' | 'gl'>('ca');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB');
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !displayName.trim()) return;

    try {
      setLoading(true);
      setError(null);

      let avatarUrl: string | null = null;

      // Upload avatar if selected
      if (avatarFile) {
        avatarUrl = await uploadAvatar(
          user.id,
          avatarFile,
          avatarFile.name
        );
      }

      // Update profile
      await updateProfile(user.id, {
        display_name: displayName.trim(),
        avatar_url: avatarUrl,
        locale_preference: locale,
      });

      // Store locale preference
      localStorage.setItem('locale', locale);

      onComplete();
    } catch (err) {
      console.error('Profile setup error:', err);
      setError(t('errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {t('auth.setup.title')}
        </h1>
        <p className="text-gray-600 mt-1">{t('auth.setup.subtitle')}</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar */}
        <div className="flex flex-col items-center">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-colors overflow-hidden"
          >
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Avatar preview"
                className="w-full h-full object-cover"
              />
            ) : (
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
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-2 text-sm text-indigo-600 hover:text-indigo-700"
          >
            {t('auth.setup.avatar')}
          </button>
        </div>

        {/* Display name */}
        <Input
          label={t('auth.setup.displayName')}
          placeholder={t('auth.setup.displayNamePlaceholder')}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
        />

        {/* Locale */}
        <Select
          label={t('auth.setup.locale')}
          value={locale}
          onChange={(e) => setLocale(e.target.value as 'ca' | 'gl')}
          options={[
            { value: 'ca', label: t('auth.setup.localeOption.ca') },
            { value: 'gl', label: t('auth.setup.localeOption.gl') },
          ]}
        />

        {/* Submit */}
        <Button
          type="submit"
          className="w-full"
          loading={loading}
          disabled={!displayName.trim()}
        >
          {t('auth.setup.finish')}
        </Button>
      </form>
    </div>
  );
}
