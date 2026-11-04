/**
 * imageProcessing.ts
 * Client-side Canvas-based image validation, cropping, and downscaling.
 * Ensures memory safety and compact storage without UI thread lockup.
 */

export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB for high-res mobile cameras (e.g. Samsung Note 20 Ultra)
export const ALLOWED_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
  'image/*',
];
export const MAX_AVATAR_DIMENSION = 256;
export const MAX_BG_DIMENSION = 1920;

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate image file size and MIME type (handles Android WebView content URI edge cases)
 */
export function validateImageFile(file: File): ValidationResult {
  const type = (file.type || '').toLowerCase();
  const name = (file.name || '').toLowerCase();

  const isImageMime = type.startsWith('image/') || ALLOWED_IMAGE_TYPES.includes(type);
  const isImageExt = /\.(jpe?g|png|webp|gif|bmp|heic|heif)$/i.test(name);

  // If MIME type is present and definitely not an image, reject
  if (type && !isImageMime && !isImageExt) {
    return {
      valid: false,
      error: `Định dạng ảnh không được hỗ trợ (${file.type}). Vui lòng chọn ảnh định dạng PNG, JPG, WebP hoặc GIF.`
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `Dung lượng ảnh vượt quá giới hạn 15MB (ảnh hiện tại: ${sizeMb}MB). Vui lòng chọn ảnh nhỏ hơn.`
    };
  }

  return { valid: true };
}

/**
 * Load a File/Blob into an HTMLImageElement
 */
export function loadImageElement(source: Blob | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = typeof source === 'string' ? source : URL.createObjectURL(source);

    img.onload = () => {
      if (typeof source !== 'string') {
        URL.revokeObjectURL(url);
      }
      resolve(img);
    };

    img.onerror = () => {
      if (typeof source !== 'string') {
        URL.revokeObjectURL(url);
      }
      reject(new Error('Không thể tải dữ liệu ảnh. Tệp có thể đã bị hỏng.'));
    };

    img.src = url;
  });
}

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Crop an image area and scale down to max 256x256 square blob
 */
export async function cropAndResizeAvatar(
  imageSource: Blob | HTMLImageElement,
  cropArea: CropArea
): Promise<Blob> {
  const img = imageSource instanceof HTMLImageElement ? imageSource : await loadImageElement(imageSource);

  const canvas = document.createElement('canvas');
  const targetSize = Math.min(MAX_AVATAR_DIMENSION, Math.max(cropArea.width, cropArea.height));
  canvas.width = targetSize;
  canvas.height = targetSize;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Không thể khởi tạo Canvas 2D context');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(
    img,
    cropArea.x,
    cropArea.y,
    cropArea.width,
    cropArea.height,
    0,
    0,
    targetSize,
    targetSize
  );

  return new Promise((resolve, reject) => {
    // Prefer webp, fallback to png
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          canvas.toBlob(
            (pngBlob) => {
              if (pngBlob) resolve(pngBlob);
              else reject(new Error('Lỗi xuất tệp ảnh đại diện từ Canvas'));
            },
            'image/png'
          );
        }
      },
      'image/webp',
      0.9
    );
  });
}

/**
 * Resize a background image to max 1920px width/height maintaining aspect ratio.
 */
export async function resizeBackgroundImage(file: File): Promise<Blob> {
  const img = await loadImageElement(file);

  let { width, height } = img;
  if (width > MAX_BG_DIMENSION || height > MAX_BG_DIMENSION) {
    if (width > height) {
      height = Math.round((height * MAX_BG_DIMENSION) / width);
      width = MAX_BG_DIMENSION;
    } else {
      width = Math.round((width * MAX_BG_DIMENSION) / height);
      height = MAX_BG_DIMENSION;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Không thể khởi tạo Canvas 2D context');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Lỗi nén ảnh nền'));
      },
      'image/jpeg',
      0.85
    );
  });
}

