import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, ChevronLeft, ChevronRight, Images, LoaderCircle, Trash2, Upload, X } from 'lucide-react';
import { deleteGalleryPost, getShopGallery, uploadShopGalleryImage, type GalleryPost } from '../api/galleryApi';

const MAX_UPLOAD_IMAGES = 10;

type GalleryUploadItem = {
  id: string;
  file: File;
  previewUrl: string;
  status: 'pending' | 'uploading' | 'failed';
  error?: string;
};

const cardClass = 'rounded-xl border border-[var(--hive-border)] bg-white p-5';

function createUploadId() {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function formatUploadDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

export default function ShopGalleryManagement({
  shopId,
  shopName,
  canUpload = true,
  canDelete = true,
}: {
  shopId: string;
  shopName: string;
  canUpload?: boolean;
  canDelete?: boolean;
}) {
  const [posts, setPosts] = useState<GalleryPost[]>([]);
  const [nextPage, setNextPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [uploadItems, setUploadItems] = useState<GalleryUploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const previewUrls = useRef(new Set<string>());
  const uploadLock = useRef(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const loadGallery = useCallback(async (page = 0, append = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    setLoadError(null);
    try {
      const result = await getShopGallery(shopId, page);
      setPosts((current) => {
        if (!append) return result.items;
        const existingIds = new Set(current.map((post) => post.id));
        return [...current, ...result.items.filter((post) => !existingIds.has(post.id))];
      });
      setNextPage(result.page + 1);
      setHasNext(result.hasNext);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Unable to load this shop gallery.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [shopId]);

  useEffect(() => {
    let cancelled = false;
    getShopGallery(shopId, 0)
      .then((result) => {
        if (cancelled) return;
        setPosts(result.items);
        setNextPage(result.page + 1);
        setHasNext(result.hasNext);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : 'Unable to load this shop gallery.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [shopId]);

  useEffect(() => () => {
    previewUrls.current.forEach((url) => URL.revokeObjectURL(url));
    previewUrls.current.clear();
  }, []);

  const selectedIndex = posts.findIndex((post) => post.id === selectedPostId);

  useEffect(() => {
    if (selectedIndex < 0) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setSelectedPostId(null);
      if (event.key === 'ArrowLeft' && selectedIndex > 0) {
        setSelectedPostId(posts[selectedIndex - 1].id);
      }
      if (event.key === 'ArrowRight' && selectedIndex < posts.length - 1) {
        setSelectedPostId(posts[selectedIndex + 1].id);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [posts, selectedIndex]);

  function addFiles(files: FileList | File[]) {
    const incoming = Array.from(files);
    const images = incoming.filter((file) => file.type.startsWith('image/'));
    const duplicateKeys = new Set(uploadItems.map((item) => `${item.file.name}:${item.file.size}:${item.file.lastModified}`));
    const uniqueImages = images.filter((file) => {
      const key = `${file.name}:${file.size}:${file.lastModified}`;
      if (duplicateKeys.has(key)) return false;
      duplicateKeys.add(key);
      return true;
    });
    const remaining = Math.max(0, MAX_UPLOAD_IMAGES - uploadItems.length);
    const accepted = uniqueImages.slice(0, remaining);

    if (images.length !== incoming.length) {
      setMutationError('Only image files can be added to the gallery.');
    } else if (uniqueImages.length > remaining) {
      setMutationError(`You can upload up to ${MAX_UPLOAD_IMAGES} images at a time.`);
    } else {
      setMutationError(null);
    }
    setNotice(null);
    setUploadItems((current) => [
      ...current,
      ...accepted.map((file) => {
        const previewUrl = URL.createObjectURL(file);
        previewUrls.current.add(previewUrl);
        return { id: createUploadId(), file, previewUrl, status: 'pending' as const };
      }),
    ]);
  }

  function removeSelectedImage(id: string) {
    const item = uploadItems.find((image) => image.id === id);
    if (item) {
      URL.revokeObjectURL(item.previewUrl);
      previewUrls.current.delete(item.previewUrl);
    }
    setUploadItems((current) => current.filter((image) => image.id !== id));
  }

  async function uploadSelectedImages() {
    if (uploadLock.current) return;
    const pending = uploadItems.filter((image) => image.status === 'pending' || image.status === 'failed');
    if (!pending.length) return;

    uploadLock.current = true;
    setIsUploading(true);
    setMutationError(null);
    setNotice(null);
    const uploadedIds = new Set<string>();
    let failedCount = 0;

    for (const item of pending) {
      setUploadItems((current) => current.map((image) => image.id === item.id
        ? { ...image, status: 'uploading', error: undefined }
        : image));
      try {
        await uploadShopGalleryImage(shopId, item.id, item.file);
        uploadedIds.add(item.id);
      } catch (error) {
        failedCount += 1;
        const message = error instanceof Error ? error.message : 'Upload failed. Please try again.';
        setUploadItems((current) => current.map((image) => image.id === item.id
          ? { ...image, status: 'failed', error: message }
          : image));
      }
    }

    uploadLock.current = false;
    setIsUploading(false);
    if (uploadedIds.size) {
      uploadItems
        .filter((image) => uploadedIds.has(image.id))
        .forEach((image) => {
          URL.revokeObjectURL(image.previewUrl);
          previewUrls.current.delete(image.previewUrl);
        });
      setUploadItems((current) => current.filter((image) => {
        return !uploadedIds.has(image.id);
      }));
      setNotice(failedCount
        ? `${uploadedIds.size} image${uploadedIds.size === 1 ? '' : 's'} uploaded; ${failedCount} failed and can be retried.`
        : `${uploadedIds.size} image${uploadedIds.size === 1 ? '' : 's'} uploaded to ${shopName}'s gallery.`);
      await loadGallery();
    } else if (failedCount) {
      setMutationError(`${failedCount} image${failedCount === 1 ? '' : 's'} could not be uploaded. Review the error and retry.`);
    }
  }

  async function removePost(post: GalleryPost) {
    if (post.sourceType === 'PRODUCT') return;
    if (!window.confirm('Delete this gallery image? This cannot be undone.')) return;
    setDeletingPostId(post.id);
    setMutationError(null);
    setNotice(null);
    try {
      await deleteGalleryPost(post.id);
      setPosts((current) => current.filter((item) => item.id !== post.id));
      if (selectedPostId === post.id) setSelectedPostId(null);
      setNotice('Gallery image deleted.');
    } catch (error) {
      setMutationError(error instanceof Error ? error.message : 'Unable to delete this gallery image.');
    } finally {
      setDeletingPostId(null);
    }
  }

  return (
    <section aria-labelledby={`gallery-management-${shopId}`} className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id={`gallery-management-${shopId}`} className="text-xl font-bold text-[#17191c]">Shop Gallery</h2>
          <p className="mt-1 text-sm text-gray-600">
            {canUpload ? `Manage photos shared by ${shopName}.` : `Gallery photos for ${shopName}.`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadGallery()}
          disabled={loading}
          className="rounded-lg border border-[var(--hive-border)] bg-white px-3 py-2 text-sm font-semibold text-[#17191c] disabled:opacity-50"
        >
          Refresh
        </button>
      </header>

      {canUpload && (
        <section className={`${cardClass} space-y-4`}>
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 text-[#008100]"><Camera size={20} /></span>
            <div>
              <h3 className="font-semibold text-[#17191c]">Upload to Gallery</h3>
              <p className="mt-1 text-sm text-gray-600">Share up to {MAX_UPLOAD_IMAGES} photos without creating product listings.</p>
            </div>
          </div>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            multiple
            aria-label="Choose gallery images"
            className="sr-only"
            onChange={(event) => {
              if (event.currentTarget.files) addFiles(event.currentTarget.files);
              event.currentTarget.value = '';
            }}
          />
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={isUploading || uploadItems.length >= MAX_UPLOAD_IMAGES}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[var(--hive-border)] bg-white px-4 py-2.5 text-sm font-semibold text-[#17191c] disabled:opacity-50"
          >
            <Images size={17} /> Choose images ({uploadItems.length}/{MAX_UPLOAD_IMAGES})
          </button>

          {uploadItems.length > 0 && (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {uploadItems.map((item, index) => (
                  <div key={item.id} className="overflow-hidden rounded-lg border border-[var(--hive-border)] bg-gray-50">
                    <div className="relative aspect-square">
                      <img src={item.previewUrl} alt={`Selected gallery image ${index + 1}`} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        aria-label={`Remove selected image ${index + 1}`}
                        disabled={isUploading}
                        onClick={() => removeSelectedImage(item.id)}
                        className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-white disabled:opacity-50"
                      >
                        <X size={15} />
                      </button>
                    </div>
                    <div className="space-y-1 p-2 text-xs">
                      <p className="truncate text-gray-700">{item.file.name}</p>
                      <p className={item.status === 'failed' ? 'text-red-700' : 'text-gray-500'}>
                        {item.status === 'uploading' ? 'Uploading…' : item.status === 'failed' ? item.error : 'Ready to upload'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => void uploadSelectedImages()}
                disabled={isUploading || uploadItems.every((item) => item.status === 'uploading')}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#008100] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {isUploading ? <LoaderCircle size={17} className="animate-spin" /> : <Upload size={17} />}
                {isUploading ? 'Uploading images…' : uploadItems.some((item) => item.status === 'failed') ? 'Retry failed images' : 'Upload images'}
              </button>
            </>
          )}
        </section>
      )}

      {mutationError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{mutationError}</p>}
      {notice && <p role="status" className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">{notice}</p>}
      {loadError && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {loadError}
          <button type="button" onClick={() => void loadGallery()} className="ml-2 font-semibold underline">Try again</button>
        </div>
      )}

      {loading ? (
        <div role="status" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => <div key={index} className="aspect-square animate-pulse rounded-xl bg-gray-200" />)}
        </div>
      ) : posts.length === 0 && !loadError ? (
        <div className={`${cardClass} flex flex-col items-center gap-2 py-10 text-center`}>
          <Images size={30} className="text-gray-400" />
          <p className="font-semibold text-[#17191c]">No gallery images yet</p>
          <p className="text-sm text-gray-600">{canUpload ? 'Upload photos to showcase your shop and products.' : 'This shop has not shared any gallery images.'}</p>
        </div>
      ) : posts.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {posts.map((post, index) => (
            <article key={post.id} className="group overflow-hidden rounded-xl border border-[var(--hive-border)] bg-white">
              <button type="button" onClick={() => setSelectedPostId(post.id)} aria-label={`View image ${index + 1} from ${shopName}`} className="relative block aspect-square w-full bg-gray-100">
                <img src={post.imageUrl} alt={`${post.sourceType === 'PRODUCT' ? post.productName || 'Product' : shopName} gallery image`} loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]" />
                {post.sourceType === 'PRODUCT' && (
                  <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-1 text-xs font-semibold text-white">
                    Product{post.productName ? ` · ${post.productName}` : ''}
                  </span>
                )}
              </button>
              <div className="flex items-center justify-between gap-2 p-3">
                <time dateTime={post.createdAt} className="text-xs text-gray-600">{formatUploadDate(post.createdAt)}</time>
                {canDelete && post.sourceType !== 'PRODUCT' && (
                  <button
                    type="button"
                    aria-label="Delete gallery image"
                    title="Delete gallery image"
                    disabled={deletingPostId === post.id}
                    onClick={() => void removePost(post)}
                    className="rounded-lg p-2 text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    {deletingPostId === post.id ? <LoaderCircle size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {hasNext && !loading && (
        <button
          type="button"
          onClick={() => void loadGallery(nextPage, true)}
          disabled={loadingMore}
          className="rounded-lg border border-[var(--hive-border)] bg-white px-4 py-2.5 text-sm font-semibold text-[#17191c] disabled:opacity-50"
        >
          {loadingMore ? 'Loading…' : 'Load more images'}
        </button>
      )}

      {selectedIndex >= 0 && posts[selectedIndex] && (
        <div role="presentation" onClick={() => setSelectedPostId(null)} className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-label={`Gallery image from ${shopName}`}
            onClick={(event) => event.stopPropagation()}
            className="relative flex h-full max-h-[90vh] w-full max-w-5xl items-center justify-center"
          >
            <img src={posts[selectedIndex].imageUrl} alt={`Gallery image from ${shopName}`} className="max-h-full max-w-full object-contain" />
            <button type="button" aria-label="Close image viewer" onClick={() => setSelectedPostId(null)} className="absolute right-0 top-0 rounded-full bg-black/60 p-3 text-white"><X size={22} /></button>
            {selectedIndex > 0 && (
              <button type="button" aria-label="Previous image" onClick={() => setSelectedPostId(posts[selectedIndex - 1].id)} className="absolute left-0 rounded-full bg-black/60 p-3 text-white"><ChevronLeft size={25} /></button>
            )}
            {selectedIndex < posts.length - 1 && (
              <button type="button" aria-label="Next image" onClick={() => setSelectedPostId(posts[selectedIndex + 1].id)} className="absolute right-0 top-1/2 rounded-full bg-black/60 p-3 text-white"><ChevronRight size={25} /></button>
            )}
            <p className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-sm text-white">{selectedIndex + 1} / {posts.length}</p>
          </section>
        </div>
      )}
    </section>
  );
}
