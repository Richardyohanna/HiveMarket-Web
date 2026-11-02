import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { getShopGallery, type GalleryPost } from '../api/galleryApi';

export default function ShopGallerySection({ shopId, shopName }: { shopId: string; shopName: string }) {
  const [posts, setPosts] = useState<GalleryPost[]>([]);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    getShopGallery(shopId, 0)
      .then((response) => {
        if (cancelled) return;
        setPosts(response.items);
        setPage(response.page + 1);
        setHasNext(response.hasNext);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Unable to load this shop’s Gallery.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [shopId]);

  useEffect(() => {
    if (selectedIndex == null) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setSelectedIndex(null);
      if (event.key === 'ArrowLeft') setSelectedIndex((current) => current == null ? null : Math.max(0, current - 1));
      if (event.key === 'ArrowRight') setSelectedIndex((current) => current == null ? null : Math.min(posts.length - 1, current + 1));
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [posts.length, selectedIndex]);

  async function loadMore() {
    if (loadingMore || !hasNext) return;
    setLoadingMore(true);
    setError(null);
    try {
      const response = await getShopGallery(shopId, page);
      setPosts((current) => {
        const ids = new Set(current.map((post) => post.id));
        return [...current, ...response.items.filter((post) => !ids.has(post.id))];
      });
      setPage(response.page + 1);
      setHasNext(response.hasNext);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load more Gallery images.');
    } finally {
      setLoadingMore(false);
    }
  }

  function retryInitialLoad() {
    setPage(0);
    setPosts([]);
    setLoading(true);
    setError(null);
    getShopGallery(shopId, 0)
      .then((response) => {
        setPosts(response.items);
        setPage(response.page + 1);
        setHasNext(response.hasNext);
      })
      .catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : 'Unable to load this shop’s Gallery.'))
      .finally(() => setLoading(false));
  }

  return (
    <section aria-labelledby={`shop-gallery-${shopId}`} className="space-y-4">
      <div>
        <h2 id={`shop-gallery-${shopId}`} className="text-lg font-bold text-[#17191c]">Gallery</h2>
        <p className="text-sm text-gray-500">Photos shared by {shopName}.</p>
      </div>

      {loading && <p role="status" className="rounded-xl border border-[var(--hive-border)] bg-white p-5 text-sm text-gray-600">Loading shop Gallery…</p>}
      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
          {!loading && <button type="button" onClick={retryInitialLoad} className="ml-2 font-semibold underline">Retry</button>}
        </div>
      )}
      {!loading && !error && posts.length === 0 && (
        <p className="rounded-xl border border-dashed border-[var(--hive-border)] bg-white p-5 text-sm text-gray-600">{shopName} has not uploaded any Gallery images yet.</p>
      )}
      {posts.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {posts.map((post, index) => (
            <button
              key={post.id}
              type="button"
              onClick={() => setSelectedIndex(index)}
              aria-label={`Open Gallery image ${index + 1} from ${shopName}`}
              className="group relative aspect-square overflow-hidden rounded-xl bg-gray-100"
            >
              <img src={post.imageUrl} alt={`Gallery photo from ${shopName}`} loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-[1.03]" />
            </button>
          ))}
        </div>
      )}
      {hasNext && !loading && (
        <button type="button" disabled={loadingMore} onClick={() => void loadMore()} className="rounded-lg border border-[var(--hive-border)] bg-white px-4 py-2 text-sm font-semibold text-[#17191c] disabled:opacity-50">
          {loadingMore ? 'Loading…' : 'Load more images'}
        </button>
      )}

      {selectedIndex != null && posts[selectedIndex] && (
        <div
          role="presentation"
          onClick={() => setSelectedIndex(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
        >
          <section role="dialog" aria-modal="true" aria-label={`Gallery image from ${shopName}`} onClick={(event) => event.stopPropagation()} className="relative flex h-full max-h-[90vh] w-full max-w-5xl items-center justify-center">
            <img src={posts[selectedIndex].imageUrl} alt={`Gallery photo from ${shopName}`} className="max-h-full max-w-full object-contain" />
            <button type="button" aria-label="Close image viewer" onClick={() => setSelectedIndex(null)} className="absolute right-0 top-0 rounded-full bg-black/60 p-3 text-white"><X size={22} /></button>
            {selectedIndex > 0 && <button type="button" aria-label="Previous image" onClick={() => setSelectedIndex((current) => current == null ? null : current - 1)} className="absolute left-0 rounded-full bg-black/60 p-3 text-white"><ChevronLeft size={25} /></button>}
            {selectedIndex < posts.length - 1 && <button type="button" aria-label="Next image" onClick={() => setSelectedIndex((current) => current == null ? null : current + 1)} className="absolute right-0 top-1/2 rounded-full bg-black/60 p-3 text-white"><ChevronRight size={25} /></button>}
            <p className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-sm text-white">{selectedIndex + 1} / {posts.length}</p>
          </section>
        </div>
      )}
    </section>
  );
}
