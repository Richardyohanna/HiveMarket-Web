const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
const MAX_SOURCE_BYTES = 50 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 2560;

const CANONICAL_EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function normalizedMimeType(mimeType: string) {
  const mime = mimeType.split(';', 1)[0].trim().toLowerCase();
  if (mime === 'image/jpg' || mime === 'image/pjpeg') return 'image/jpeg';
  if (mime === 'image/x-png') return 'image/png';
  if (mime === 'application/heic') return 'image/heic';
  if (mime === 'application/heif') return 'image/heif';
  return mime;
}

async function detectImageType(file: File): Promise<string | null> {
  const bytes = new Uint8Array(await file.slice(0, 40).arrayBuffer());
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if ([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
    .every((byte, index) => bytes[index] === byte)) return 'image/png';
  if (bytes.length >= 12
    && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF'
    && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP') return 'image/webp';
  if (bytes.length >= 16 && String.fromCharCode(...bytes.slice(4, 8)) === 'ftyp') {
    const brands = String.fromCharCode(...bytes.slice(8)).toLowerCase();
    if (brands.includes('avif') || brands.includes('avis')) return null;
    if (['heic', 'heix', 'hevc', 'hevx', 'heif', 'heis', 'heim', 'hevm', 'hevs', 'mif1', 'msf1']
      .some((brand) => brands.includes(brand))) return 'heic';
  }
  return null;
}

function makeFile(blob: Blob, fileName: string, type: string, lastModified: number) {
  return new File([blob], fileName, { type, lastModified });
}

function canvasBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('The selected image could not be prepared for upload.'));
    }, type, quality);
  });
}

async function compressImage(file: File) {
  if (typeof createImageBitmap !== 'function') {
    throw new Error('This image is too large to upload directly. Choose a smaller image or use a browser that supports image resizing.');
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error('This image could not be opened. Try saving it as JPG, PNG, or WEBP and select it again.');
  }

  try {
    const largestSide = Math.max(bitmap.width, bitmap.height);
    const scale = Math.min(1, MAX_IMAGE_DIMENSION / largestSide);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Image resizing is not available in this browser.');

    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const originalMime = normalizedMimeType(file.type);
    const outputMime = originalMime === 'image/png' ? 'image/png' : 'image/jpeg';
    const blob = await canvasBlob(canvas, outputMime, outputMime === 'image/jpeg' ? 0.88 : undefined);
    const mime = CANONICAL_EXTENSION[blob.type] ? blob.type : outputMime;
    const extension = CANONICAL_EXTENSION[mime];
    const stem = file.name.replace(/\.[^.]+$/, '');
    const compressed = makeFile(blob, `${stem}.${extension}`, mime, file.lastModified);
    if (compressed.size > MAX_UPLOAD_BYTES) {
      throw new Error('This image is still too large after resizing. Choose a smaller image (maximum upload size is 20 MB).');
    }
    return compressed;
  } finally {
    bitmap.close();
  }
}

export async function prepareShopImage(file: File): Promise<File> {
  if (file.size === 0) throw new Error('The selected image is empty.');
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error('This image is too large to prepare. Choose an image smaller than 50 MB.');
  }

  const supportedType = await detectImageType(file);
  if (!supportedType) {
    throw new Error('The selected file is not a supported image. Choose a JPG, JPEG, PNG, WEBP, HEIC, or HEIF image.');
  }
  let prepared: File;

  if (supportedType === 'heic') {
    try {
      const { default: heic2any } = await import('heic2any');
      const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 });
      const jpeg = Array.isArray(converted) ? converted[0] : converted;
      if (!jpeg || jpeg.type !== 'image/jpeg') {
        throw new Error('HEIC conversion did not produce a JPEG image.');
      }
      const stem = file.name.replace(/\.[^.]+$/, '') || 'shop-image';
      prepared = makeFile(jpeg, `${stem}.jpg`, 'image/jpeg', file.lastModified);
    } catch (error) {
      throw new Error(error instanceof Error && error.message.includes('HEIC conversion')
        ? error.message
        : 'This HEIC/HEIF image could not be converted. Save it as JPG or PNG and try again.',
      { cause: error });
    }
  } else {
    const extension = CANONICAL_EXTENSION[supportedType];
    const stem = file.name.replace(/\.[^.]+$/, '') || 'shop-image';
    prepared = makeFile(file, `${stem}.${extension}`, supportedType, file.lastModified);
  }

  return prepared.size > MAX_UPLOAD_BYTES ? compressImage(prepared) : prepared;
}
