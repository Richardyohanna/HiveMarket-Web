import { useEffect, useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';

const MAX_NEW_IMAGES = 5;

export default function ProductImagePicker({
  existingImages = [],
  images,
  onChange,
}: {
  existingImages?: string[];
  images: File[];
  onChange: (images: File[]) => void;
}) {
  const [previewUrls, setPreviewUrls] = useState<Map<File, string>>(new Map());
  const previewUrlsRef = useRef(new Map<File, string>());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => {
    previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    previewUrlsRef.current.clear();
  }, []);

  function addImages(files: FileList | null) {
    if (!files) return;
    const selected = Array.from(files);
    const valid = selected.filter((file) => file.type.startsWith('image/'));
    const duplicateKeys = new Set(images.map((file) => `${file.name}:${file.size}:${file.lastModified}`));
    const uniqueImages = valid.filter((file) => {
      const key = `${file.name}:${file.size}:${file.lastModified}`;
      if (duplicateKeys.has(key)) return false;
      duplicateKeys.add(key);
      return true;
    });
    const combined = [...images, ...uniqueImages].slice(0, MAX_NEW_IMAGES);
    const accepted = combined.slice(images.length);
    const nextPreviewUrls = new Map(previewUrlsRef.current);
    accepted.forEach((file) => {
      const url = URL.createObjectURL(file);
      nextPreviewUrls.set(file, url);
      previewUrlsRef.current.set(file, url);
    });
    setPreviewUrls(nextPreviewUrls);
    onChange(combined);
    setError(selected.length !== valid.length
      ? 'Only image files can be uploaded.'
      : images.length + uniqueImages.length > MAX_NEW_IMAGES
        ? `You can upload up to ${MAX_NEW_IMAGES} new product images at a time.`
        : null);
  }

  return (
    <div className="space-y-3">
      {existingImages.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">Current product images</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {existingImages.map((url, index) => (
              <img key={`${url}-${index}`} src={url} alt={`Current product image ${index + 1}`} className="aspect-square w-full rounded-lg object-cover" />
            ))}
          </div>
          <p className="mt-1 text-xs text-gray-500">Existing images stay on the product; selected images will be added.</p>
        </div>
      )}
      <label className="flex min-h-11 w-fit cursor-pointer items-center gap-2 rounded-lg border border-[var(--hive-border)] bg-white px-3 py-2 text-sm font-semibold text-[#17191c]">
        <ImagePlus size={17} />
        Add images ({images.length}/{MAX_NEW_IMAGES})
        <input
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(event) => {
            addImages(event.currentTarget.files);
            event.currentTarget.value = '';
          }}
        />
      </label>
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {images.map((image, index) => (
            <div key={`${image.name}-${image.lastModified}-${index}`} className="relative aspect-square">
              <img src={previewUrls.get(image) || ''} alt={`Selected product image ${index + 1}`} className="h-full w-full rounded-lg object-cover" />
              <button
                type="button"
                aria-label={`Remove selected product image ${index + 1}`}
                onClick={() => {
                  const url = previewUrlsRef.current.get(image);
                  if (url) URL.revokeObjectURL(url);
                  previewUrlsRef.current.delete(image);
                  const nextPreviewUrls = new Map(previewUrlsRef.current);
                  setPreviewUrls(nextPreviewUrls);
                  onChange(images.filter((_, currentIndex) => currentIndex !== index));
                }}
                className="absolute right-1 top-1 rounded-full bg-black/70 p-1.5 text-white"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </div>
  );
}
