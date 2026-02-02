import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { Database } from '@/lib/database.types';
import { useTranslation } from '@/lib/i18n';

type Place = Database['public']['Tables']['places']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

interface PlaceWithCategory extends Place {
  category?: Category | null;
}

interface PlaceMarkerProps {
  place: PlaceWithCategory;
  onClick?: () => void;
}

// Custom marker icons by category color
const createIcon = (color: string = '#6366f1') => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background-color: ${color};
        border: 3px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      ">
        <div style="
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          transform: rotate(45deg);
        ">
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

export function PlaceMarker({ place, onClick }: PlaceMarkerProps) {
  const { t } = useTranslation();
  const icon = createIcon(place.category?.color || '#6366f1');

  const statusLabels = {
    queremos_ir: t('places.status.queremos_ir'),
    hemos_ido: t('places.status.hemos_ido'),
    pendiente: t('places.status.pendiente'),
  };

  const statusColors = {
    queremos_ir: 'bg-yellow-100 text-yellow-800',
    hemos_ido: 'bg-green-100 text-green-800',
    pendiente: 'bg-gray-100 text-gray-800',
  };

  return (
    <Marker
      position={[Number(place.lat), Number(place.lng)]}
      icon={icon}
      eventHandlers={{
        click: onClick,
      }}
    >
      <Popup>
        <div className="min-w-[200px]">
          <h3 className="font-semibold text-gray-900 mb-1">{place.name}</h3>
          {place.category && (
            <span
              className="inline-block px-2 py-0.5 text-xs rounded-full mb-2"
              style={{
                backgroundColor: `${place.category.color}20`,
                color: place.category.color,
              }}
            >
              {place.category.name}
            </span>
          )}
          {place.description && (
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
              {place.description}
            </p>
          )}
          <span
            className={`inline-block px-2 py-0.5 text-xs rounded-full ${statusColors[place.status]}`}
          >
            {statusLabels[place.status]}
          </span>
          {place.address && (
            <p className="text-xs text-gray-500 mt-2">{place.address}</p>
          )}
          {onClick && (
            <button
              onClick={onClick}
              className="mt-2 text-sm text-indigo-600 hover:text-indigo-700"
            >
              {t('common.edit')}
            </button>
          )}
        </div>
      </Popup>
    </Marker>
  );
}
