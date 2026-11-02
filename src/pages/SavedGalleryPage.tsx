import { useCallback, useEffect, useRef, useState } from 'react';
import { Bookmark, Store } from 'lucide-react';
import { getSavedGalleryImages, setGallerySaved, type GalleryPost } from '../api/galleryApi';
import { useRouter } from '../lib/router';

export default function SavedGalleryPage() {
  const { navigate } = useRouter();
  const [images, setImages] = useState<GalleryPost[]>([]);
  const [hasNext, setHasNext] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyIds, setBusyIds] = useState<Set<string>>(() => new Set());
  const nextPageRef = useRef(0);
  const requestInFlightRef = useRef(false);
  const hasNextRef = useRef(true);

  const loadNextPage = useCallback(async () => {
    if (requestInFlightRef.current || !hasNextRef.current) return;
    requestInFlightRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const response = await getSavedGalleryImages(nextPageRef.current);
      setImages((current) => {
        const existingIds = new Set(current.map((image) => image.id));
        return [...current, ...response.items.filter((image) => !existingIds.has(image.id))];
      });
      nextPageRef.current = response.page + 1;
      hasNextRef.current = response.hasNext;
      setHasNext(response.hasNext);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load saved Gallery images.');
    } finally {
      requestInFlightRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNextPage();
  }, [loadNextPage]);

  async function removeSavedImage(image: GalleryPost) {
    if (busyIds.has(image.id)) return;
    setBusyIds((current) => new Set(current).add(image.id));
    setError(null);
    try {
      await setGallerySaved(image.id, false);
      setImages((current) => current.filter((item) => item.id !== image.id));
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : 'Unable to remove the saved image.');
    } finally {
      setBusyIds((current) => {
        const next = new Set(current);
        next.delete(image.id);
        return next;
      });
    }
  }

  return (
    <main className="min-h-screen bg-[var(--hive-background)] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <button type="button" onClick={() => navigate('/shopping')} className="mb-5 text-sm font-semibold text-[#008100] hover:underline">
          Back to shopping
        </button>
        <h1 className="text-2xl font-bold text-[#17191c]">Saved Gallery images</h1>
        <p className="mt-1 text-sm text-gray-600">Images you save from the Gallery are collected here.</p>

        {error && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <p role="alert">{error}</p>
            <button type="button" onClick={() => void loadNextPage()} className="font-semibold underline">Retry</button>
          </div>
        )}

        {loading && images.length === 0 ? (
          <p role="status" className="py-16 text-center text-sm text-gray-600">Loading saved images…</p>
        ) : images.length === 0 ? (
          <section className="mt-8 rounded-xl border border-[var(--hive-border)] bg-white px-6 py-16 text-center">
            <Bookmark className="mx-auto text-gray-400" size={32} />
            <h2 className="mt-3 font-semibold text-[#17191c]">No saved Gallery images</h2>
            <p className="mt-1 text-sm text-gray-600">Save an image from the Gallery to find it here.</p>
            <button type="button" onClick={() => navigate('/shopping/gallery')} className="mt-4 rounded-lg bg-[#008100] px-4 py-2 text-sm font-semibold text-white hover:bg-[#006d24]">
              Browse Gallery
            </button>
          </section>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {images.map((image) => (
              <article key={image.id} className="overflow-hidden rounded-xl border border-[var(--hive-border)] bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => navigate(image.productId
                    ? `/product/${encodeURIComponent(image.productId)}`
                    : `/shopping/shop/${encodeURIComponent(image.shopId)}`)}
                  className="block aspect-[4/5] w-full bg-gray-100"
                  aria-label={`Open ${image.productName || image.shopName}`}
                >
                  <img src={image.imageUrl} alt={`${image.shopName} Gallery image`} loading="lazy" className="h-full w-full object-cover" />
                </button>
                <div className="flex items-center gap-2 p-3">
                  <Store size={15} className="shrink-0 text-[#008100]" aria-hidden="true" />
                  <button
                    type="button"
                    onClick={() => navigate(`/shopping/shop/${encodeURIComponent(image.shopId)}`)}
                    className="min-w-0 flex-1 truncate text-left text-sm font-semibold text-[#17191c] hover:text-[#008100]"
                  >
                    {image.shopName}
                  </button>
                  <button
                    type="button"
                    disabled={busyIds.has(image.id)}
                    onClick={() => void removeSavedImage(image)}
                    aria-label={`Remove saved image from ${image.shopName}`}
                    className="rounded-md p-1.5 text-[#008100] hover:bg-green-50 disabled:opacity-50"
                  >
                    <Bookmark size={18} fill="currentColor" aria-hidden="true" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {hasNext && images.length > 0 && (
          <button type="button" disabled={loading} onClick={() => void loadNextPage()} className="mx-auto mt-6 block rounded-lg border border-[var(--hive-border)] bg-white px-5 py-2.5 text-sm font-semibold text-[#17191c] hover:bg-gray-50 disabled:opacity-60">
            {loading ? 'Loading…' : 'Load more'}
          </button>
        )}
      </div>
    </main>
  );
}
