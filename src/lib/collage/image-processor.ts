import { CollageImage } from './types';

export async function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to load image: ${file.name}`));
    };

    img.src = url;
  });
}

export async function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image from URL: ${url}`));

    img.src = url;
  });
}

export async function createThumbnail(
  file: File,
  maxSize: number = 200
): Promise<string> {
  const img = await loadImageFromFile(file);
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  const scale = Math.min(maxSize / img.width, maxSize / img.height);
  canvas.width = img.width * scale;
  canvas.height = img.height * scale;

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL('image/jpeg', 0.8);
}

export function drawImageCropped(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  const imgAspect = img.width / img.height;
  const cellAspect = width / height;

  let sx = 0;
  let sy = 0;
  let sWidth = img.width;
  let sHeight = img.height;

  if (imgAspect > cellAspect) {
    sWidth = img.height * cellAspect;
    sx = (img.width - sWidth) / 2;
  } else {
    sHeight = img.width / cellAspect;
    sy = (img.height - sHeight) / 2;
  }

  ctx.drawImage(img, sx, sy, sWidth, sHeight, x, y, width, height);
}

export function applyGrayscale(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  const imageData = ctx.getImageData(x, y, width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
    data[i] = avg;
    data[i + 1] = avg;
    data[i + 2] = avg;
  }

  ctx.putImageData(imageData, x, y);
}

export function applyGradientOverlay(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color1: string,
  color2: string
): void {
  const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
  gradient.addColorStop(0, color1);
  gradient.addColorStop(1, color2);

  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, width, height);
  ctx.restore();
}

export async function processImages(
  images: CollageImage[],
  maxConcurrent: number = 10
): Promise<Map<string, HTMLImageElement>> {
  const imageMap = new Map<string, HTMLImageElement>();
  const batches: CollageImage[][] = [];

  for (let i = 0; i < images.length; i += maxConcurrent) {
    batches.push(images.slice(i, i + maxConcurrent));
  }

  for (const batch of batches) {
    const promises = batch.map(async (img) => {
      try {
        const htmlImg = img.file
          ? await loadImageFromFile(img.file)
          : img.url
          ? await loadImageFromUrl(img.url)
          : null;

        if (htmlImg) {
          imageMap.set(img.id, htmlImg);
        }
      } catch (error) {
        console.error(`Failed to load image ${img.id}:`, error);
      }
    });

    await Promise.all(promises);
  }

  return imageMap;
}

export function validateImageFile(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  const maxSize = 50 * 1024 * 1024; // 50MB

  if (!validTypes.includes(file.type)) {
    return false;
  }

  if (file.size > maxSize) {
    return false;
  }

  return true;
}

export async function batchCreateThumbnails(
  files: File[],
  onProgress?: (current: number, total: number) => void
): Promise<Map<string, string>> {
  const thumbnails = new Map<string, string>();

  for (let i = 0; i < files.length; i++) {
    try {
      const thumbnail = await createThumbnail(files[i]);
      thumbnails.set(files[i].name, thumbnail);
      onProgress?.(i + 1, files.length);
    } catch (error) {
      console.error(`Failed to create thumbnail for ${files[i].name}:`, error);
    }
  }

  return thumbnails;
}
