import { getCanvasBlob } from './canvas-renderer';

function crc32(data: Uint8Array): number {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }

  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = table[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createPhysChunk(pixelsPerMeter: number): Uint8Array {
  const chunk = new Uint8Array(21);
  const view = new DataView(chunk.buffer);

  view.setUint32(0, 9);

  const typeBytes = new TextEncoder().encode('pHYs');
  chunk.set(typeBytes, 4);

  view.setUint32(8, pixelsPerMeter);
  view.setUint32(12, pixelsPerMeter);
  view.setUint8(16, 1);

  const dataForCrc = new Uint8Array(13);
  dataForCrc.set(typeBytes, 0);
  dataForCrc.set(chunk.slice(8, 17), 4);
  const crc = crc32(dataForCrc);
  view.setUint32(17, crc);

  return chunk;
}

function embedPngDpi(pngBytes: Uint8Array, dpi: number): Uint8Array {
  const pixelsPerMeter = Math.round(dpi * 39.3701);
  const physChunk = createPhysChunk(pixelsPerMeter);

  const insertAt = 33;

  const result = new Uint8Array(pngBytes.length + physChunk.length);
  result.set(pngBytes.slice(0, insertAt), 0);
  result.set(physChunk, insertAt);
  result.set(pngBytes.slice(insertAt), insertAt + physChunk.length);

  return result;
}

export async function exportCanvasWithDpi(
  canvas: HTMLCanvasElement,
  dpi: number,
  filename: string
): Promise<void> {
  const blob = await getCanvasBlob(canvas, 'image/png');
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  const pngWithDpi = embedPngDpi(bytes, dpi);

  const finalBlob = new Blob([new Uint8Array(pngWithDpi)], { type: 'image/png' });
  const url = URL.createObjectURL(finalBlob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}

export async function exportCanvas(
  canvas: HTMLCanvasElement,
  filename: string,
  format: 'png' = 'png',
  dpi: number = 200
): Promise<void> {
  if (format === 'png') {
    await exportCanvasWithDpi(canvas, dpi, filename);
  } else {
    throw new Error(`Unsupported export format: ${format}`);
  }
}

export function getEstimatedFileSize(
  width: number,
  height: number,
  format: 'png' = 'png'
): string {
  const pixels = width * height;
  const bytesPerPixel = format === 'png' ? 4 : 1;
  const estimatedBytes = pixels * bytesPerPixel;

  const mb = estimatedBytes / (1024 * 1024);

  if (mb < 1) {
    return `${(mb * 1024).toFixed(0)} KB`;
  }

  return `${mb.toFixed(1)} MB`;
}

export function validateExportDimensions(
  width: number,
  height: number
): { valid: boolean; message?: string } {
  const MAX_DIMENSION = 16384;
  const MAX_PIXELS = 268435456;

  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    return {
      valid: false,
      message: `Canvas dimensions exceed browser limit (${MAX_DIMENSION}px per side)`,
    };
  }

  if (width * height > MAX_PIXELS) {
    return {
      valid: false,
      message: 'Total canvas area exceeds browser limit',
    };
  }

  return { valid: true };
}

export async function exportWithProgress(
  canvas: HTMLCanvasElement,
  filename: string,
  onProgress: (stage: string, progress: number) => void
): Promise<void> {
  try {
    onProgress('Preparing export...', 0);

    onProgress('Generating PNG...', 0.3);
    const blob = await getCanvasBlob(canvas, 'image/png');

    onProgress('Embedding metadata...', 0.6);
    const arrayBuffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const pngWithDpi = embedPngDpi(bytes, 200);

    onProgress('Creating download...', 0.9);
    const finalBlob = new Blob([new Uint8Array(pngWithDpi)], { type: 'image/png' });
    const url = URL.createObjectURL(finalBlob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);

    onProgress('Complete!', 1);
  } catch (error) {
    console.error('Export failed:', error);
    throw error;
  }
}
