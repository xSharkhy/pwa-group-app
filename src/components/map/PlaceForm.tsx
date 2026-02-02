import { useState, useEffect } from 'react';
import { Button, Input, Select } from '@/components/ui';
import { AddressAutocomplete } from './AddressAutocomplete';
import { useTranslation } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

type Place = Database['public']['Tables']['places']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];
type PlaceInsert = Database['public']['Tables']['places']['Insert'];

interface PlaceFormProps {
  groupId: string;
  initialData?: Partial<Place> & { lat?: number; lng?: number };
  onSubmit: (place: Omit<PlaceInsert, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onCancel: () => void;
  mode?: 'create' | 'edit';
}

export function PlaceForm({
  groupId,
  initialData,
  onSubmit,
  onCancel,
  mode = 'create',
}: PlaceFormProps) {
  const { t } = useTranslation();

  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [address, setAddress] = useState(initialData?.address || '');
  const [lat, setLat] = useState<number | null>(
    initialData?.lat ? Number(initialData.lat) : null
  );
  const [lng, setLng] = useState<number | null>(
    initialData?.lng ? Number(initialData.lng) : null
  );
  const [categoryId, setCategoryId] = useState(initialData?.category_id || '');
  const [status, setStatus] = useState<'queremos_ir' | 'hemos_ido' | 'pendiente'>(
    initialData?.status || 'queremos_ir'
  );
  const [externalUrl, setExternalUrl] = useState(initialData?.external_url || '');

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .or(`group_id.eq.${groupId},group_id.is.null`)
        .order('name');

      if (data) {
        setCategories(data);
      }
    }

    fetchCategories();
  }, [groupId]);

  const handleAddressSelect = (result: {
    address: string;
    lat: number;
    lng: number;
  }) => {
    setAddress(result.address);
    setLat(result.lat);
    setLng(result.lng);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || lat === null || lng === null) {
      setError(t('errors.generic'));
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await onSubmit({
        group_id: groupId,
        name: name.trim(),
        description: description.trim() || null,
        address: address.trim() || null,
        lat,
        lng,
        category_id: categoryId || null,
        status,
        external_url: externalUrl.trim() || null,
        created_by: '', // Will be set by hook
      });
    } catch (err) {
      console.error('Error saving place:', err);
      setError(t('errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = [
    { value: 'queremos_ir', label: t('places.status.queremos_ir') },
    { value: 'hemos_ido', label: t('places.status.hemos_ido') },
    { value: 'pendiente', label: t('places.status.pendiente') },
  ];

  const categoryOptions = [
    { value: '', label: '-' },
    ...categories.map((cat) => ({
      value: cat.id,
      label: cat.name,
    })),
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">
        {mode === 'create' ? t('places.add.title') : t('common.edit')}
      </h2>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <Input
        label={t('places.add.name')}
        placeholder={t('places.add.namePlaceholder')}
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('places.add.description')}
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('places.add.descriptionPlaceholder')}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <AddressAutocomplete
        label={t('places.add.address')}
        value={address}
        onChange={setAddress}
        onSelect={handleAddressSelect}
      />

      {lat !== null && lng !== null && (
        <p className="text-xs text-gray-500">
          Coords: {lat.toFixed(6)}, {lng.toFixed(6)}
        </p>
      )}

      <Select
        label={t('places.add.category')}
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        options={categoryOptions}
      />

      <Select
        label={t('places.add.status')}
        value={status}
        onChange={(e) =>
          setStatus(e.target.value as 'queremos_ir' | 'hemos_ido' | 'pendiente')
        }
        options={statusOptions}
      />

      <Input
        label={t('places.add.url')}
        type="url"
        placeholder={t('places.add.urlPlaceholder')}
        value={externalUrl}
        onChange={(e) => setExternalUrl(e.target.value)}
      />

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          className="flex-1"
        >
          {t('common.cancel')}
        </Button>
        <Button
          type="submit"
          loading={loading}
          disabled={!name.trim() || lat === null || lng === null}
          className="flex-1"
        >
          {mode === 'create' ? t('places.add.submit') : t('common.save')}
        </Button>
      </div>
    </form>
  );
}
