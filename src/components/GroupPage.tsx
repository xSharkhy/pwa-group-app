import { useEffect, useState, lazy, Suspense } from 'react';
import { I18nProvider, getLocaleFromBrowser } from '@/lib/i18n';
import { ToastProvider } from '@/components/ui/Toast';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { useAuthStore } from '@/stores/auth';
import { useGroup } from '@/hooks/useGroups';
import { usePlaces } from '@/hooks/usePlaces';
import { usePhotos } from '@/hooks/usePhotos';
import { useTranslation } from '@/lib/i18n';
import { Modal, Button, Avatar, Skeleton } from '@/components/ui';
import { PlaceMarker, PlaceForm } from '@/components/map';
import { PhotoUploader, PhotoGallery } from '@/components/photos';
import { InviteManager } from '@/components/groups';
import { RecapFeed } from '@/components/recap';
import { VotingForm, VotingResults } from '@/components/voting';
import type { LatLng } from 'leaflet';

// Lazy load MapView to defer Leaflet bundle (~160KB)
const MapView = lazy(() => import('@/components/map/MapView').then(m => ({ default: m.MapView })));

// Loading fallback for map
function MapSkeleton() {
  return (
    <div className="flex-1 bg-[var(--color-sand-dark)] flex items-center justify-center">
      <div className="text-center">
        <Skeleton className="w-16 h-16 rounded-full mx-auto mb-3" />
        <Skeleton className="w-32 h-4 mx-auto" />
      </div>
    </div>
  );
}

interface GroupPageProps {
  groupId: string;
}

// Get current week start (Saturday)
function getCurrentWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day - 1; // Saturday = 6, so we go back to previous Saturday
  const saturday = new Date(now.setDate(diff));
  return saturday.toISOString().split('T')[0];
}

function GroupContent({ groupId }: GroupPageProps) {
  const { t } = useTranslation();
  const { session, profile, loading: authLoading } = useAuthStore();
  const { group, loading: groupLoading, isAdmin } = useGroup(groupId);
  const { places, addPlace } = usePlaces(groupId);
  const { photos, deletePhoto } = usePhotos(groupId);

  const [activeTab, setActiveTab] = useState<'map' | 'photos' | 'recap' | 'voting'>('map');
  const [showPlaceForm, setShowPlaceForm] = useState(false);
  const [showPhotoUploader, setShowPhotoUploader] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showVotingForm, setShowVotingForm] = useState(false);
  const [newPlaceCoords, setNewPlaceCoords] = useState<{ lat: number; lng: number } | null>(null);

  const weekStart = getCurrentWeekStart();

  if (authLoading || groupLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-sand)]">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full bg-[var(--color-sun)] animate-pulse" />
          <div className="absolute inset-2 rounded-full bg-[var(--color-sun-light)] animate-pulse" style={{ animationDelay: '150ms' }} />
          <div className="absolute inset-4 rounded-full bg-[var(--color-cream)]" />
        </div>
        <p
          className="mt-4 text-[var(--color-ink-muted)] text-sm animate-pulse"
          style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic' }}
        >
          Carregant...
        </p>
      </div>
    );
  }

  if (!session || !profile) {
    window.location.href = '/';
    return null;
  }

  if (!group) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-sand)]">
        <div className="text-center">
          <div className="w-16 h-16 bg-[var(--color-error)]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[var(--color-error)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h2
            className="text-xl font-semibold text-[var(--color-ink)] mb-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {t('errors.notFound')}
          </h2>
          <a
            href="/"
            className="text-[var(--color-sea)] hover:text-[var(--color-sea-dark)] font-medium transition-colors"
          >
            ← {t('common.back')}
          </a>
        </div>
      </div>
    );
  }

  const handleMapLongPress = (latlng: LatLng) => {
    setNewPlaceCoords({ lat: latlng.lat, lng: latlng.lng });
    setShowPlaceForm(true);
  };

  const handleAddPlace = async (placeData: Parameters<typeof addPlace>[0]) => {
    await addPlace({
      ...placeData,
      created_by: profile.id,
    });
    setShowPlaceForm(false);
    setNewPlaceCoords(null);
  };

  const tabs = [
    {
      id: 'map' as const,
      label: t('places.title'),
      icon: 'M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z',
    },
    {
      id: 'photos' as const,
      label: t('photos.title'),
      icon: 'M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z',
    },
    {
      id: 'recap' as const,
      label: t('recap.title'),
      icon: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5',
    },
    {
      id: 'voting' as const,
      label: t('voting.title'),
      icon: 'M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-sand)]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[var(--color-cream)]/95 backdrop-blur-sm border-b-2 border-[var(--color-terracotta)]/20">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center gap-3">
          <a
            href="/"
            className="p-2 -ml-2 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-sand-dark)] rounded-xl transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </a>
          <h1
            className="font-semibold text-[var(--color-ink)] truncate flex-1 text-lg"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {group.name}
          </h1>
          {isAdmin && (
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-sand-dark)] rounded-xl transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          )}
          <Avatar
            src={profile.avatar_url}
            name={profile.display_name}
            size="sm"
          />
        </div>
      </header>

      {/* Tab content */}
      <main className="flex-1 flex flex-col">
        {activeTab === 'map' && (
          <div className="flex-1 relative">
            <Suspense fallback={<MapSkeleton />}>
              <MapView onMapLongPress={handleMapLongPress}>
                {places.map((place) => (
                  <PlaceMarker
                    key={place.id}
                    place={place}
                    onClick={() => {
                      window.location.href = `/groups/${groupId}/places/${place.id}`;
                    }}
                  />
                ))}
              </MapView>
            </Suspense>
            <button
              onClick={() => setShowPlaceForm(true)}
              className="
                absolute bottom-20 right-4 z-[1000]
                p-4
                bg-gradient-to-br from-[var(--color-sun)] to-[var(--color-sun-dark)]
                text-white rounded-2xl
                shadow-lg shadow-[var(--color-sun)]/30
                hover:shadow-xl hover:-translate-y-0.5
                transition-all duration-200
                active:scale-95
              "
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        )}

        {activeTab === 'photos' && (
          <div className="p-4 max-w-4xl mx-auto w-full">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2
                  className="text-xl font-bold text-[var(--color-ink)]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {t('photos.title')}
                </h2>
                <p className="text-sm text-[var(--color-ink-muted)]">
                  {photos.length} foto{photos.length !== 1 ? 's' : ''}
                </p>
              </div>
              <Button variant="sun" onClick={() => setShowPhotoUploader(true)}>
                <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                {t('photos.empty.cta')}
              </Button>
            </div>
            <PhotoGallery
              photos={photos}
              onDelete={deletePhoto}
              currentUserId={profile.id}
            />
          </div>
        )}

        {activeTab === 'recap' && (
          <div className="p-4 max-w-4xl mx-auto w-full">
            <RecapFeed
              groupId={groupId}
              onRecapClick={(recapId) => {
                window.location.href = `/groups/${groupId}/recap/${recapId}`;
              }}
            />
          </div>
        )}

        {activeTab === 'voting' && (
          <div className="p-4 max-w-4xl mx-auto w-full space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2
                  className="text-xl font-bold text-[var(--color-ink)]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {t('voting.title')}
                </h2>
                <p
                  className="text-sm text-[var(--color-ink-muted)]"
                  style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic' }}
                >
                  On quedem aquesta setmana?
                </p>
              </div>
              <Button variant="sea" onClick={() => setShowVotingForm(true)}>
                <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Proposar
              </Button>
            </div>
            <VotingResults groupId={groupId} weekStart={weekStart} />
          </div>
        )}
      </main>

      {/* Bottom navigation */}
      <nav className="sticky bottom-0 bg-[var(--color-cream)]/95 backdrop-blur-sm border-t-2 border-[var(--color-terracotta)]/20">
        <div className="max-w-4xl mx-auto flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 py-3 flex flex-col items-center gap-1 transition-all duration-200
                ${activeTab === tab.id
                  ? 'text-[var(--color-sun-dark)]'
                  : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
                }
              `}
            >
              <div className={`
                p-1.5 rounded-xl transition-colors
                ${activeTab === tab.id ? 'bg-[var(--color-sun)]/20' : ''}
              `}>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
                </svg>
              </div>
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Place Form Modal */}
      <Modal
        isOpen={showPlaceForm}
        onClose={() => {
          setShowPlaceForm(false);
          setNewPlaceCoords(null);
        }}
        title={t('places.add.title')}
        size="lg"
      >
        <PlaceForm
          groupId={groupId}
          initialData={newPlaceCoords || undefined}
          onSubmit={handleAddPlace}
          onCancel={() => {
            setShowPlaceForm(false);
            setNewPlaceCoords(null);
          }}
        />
      </Modal>

      {/* Photo Uploader Modal */}
      <Modal
        isOpen={showPhotoUploader}
        onClose={() => setShowPhotoUploader(false)}
        title={t('photos.upload.title')}
        size="lg"
      >
        <PhotoUploader
          groupId={groupId}
          places={places}
          onSuccess={() => setShowPhotoUploader(false)}
          onCancel={() => setShowPhotoUploader(false)}
        />
      </Modal>

      {/* Voting Form Modal */}
      <Modal
        isOpen={showVotingForm}
        onClose={() => setShowVotingForm(false)}
        size="md"
      >
        <VotingForm
          groupId={groupId}
          weekStart={weekStart}
          onSuccess={() => setShowVotingForm(false)}
          onCancel={() => setShowVotingForm(false)}
        />
      </Modal>

      {/* Settings Modal */}
      <Modal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        title={t('groups.settings.title')}
        size="md"
      >
        <div className="space-y-6">
          <InviteManager groupId={groupId} />
        </div>
      </Modal>
    </div>
  );
}

export function GroupPage({ groupId }: GroupPageProps) {
  const [locale, setLocale] = useState<'ca' | 'gl'>('ca');

  useEffect(() => {
    const stored = localStorage.getItem('locale') as 'ca' | 'gl' | null;
    if (stored && (stored === 'ca' || stored === 'gl')) {
      setLocale(stored);
    } else {
      setLocale(getLocaleFromBrowser());
    }
  }, []);

  return (
    <I18nProvider defaultLocale={locale}>
      <ToastProvider>
        <AuthProvider>
          <GroupContent groupId={groupId} />
        </AuthProvider>
      </ToastProvider>
    </I18nProvider>
  );
}
