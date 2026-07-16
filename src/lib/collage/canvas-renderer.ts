import { RenderOptions, CollageSettings } from './types';
import { getCellPositions, calculateCellVisibility } from './grid-calculator';
import {
  processImages,
  drawImageCropped,
  applyGrayscale,
  applyGradientOverlay,
} from './image-processor';

export function applyShapeClip(
  ctx: CanvasRenderingContext2D,
  svgPath: string,
  width: number,
  height: number
): void {
  try {
    const scaledPath = scaleSvgPathToCanvas(svgPath, width, height);
    const path = new Path2D(scaledPath);
    ctx.save();
    ctx.clip(path);
  } catch (error) {
    console.error('Error applying shape clip:', error);
  }
}

function scaleSvgPathToCanvas(normalizedPath: string, width: number, height: number): string {
  return normalizedPath.replace(
    /([MLHVCSQTAZ])\s*(-?\d+\.?\d*)\s*,?\s*(-?\d+\.?\d*)?/gi,
    (match, command, x, y) => {
      const scaledX = parseFloat(x) * width;
      const scaledY = y ? parseFloat(y) * height : 0;
      return y ? `${command}${scaledX},${scaledY}` : `${command}${scaledX}`;
    }
  );
}

export async function renderCollage(options: RenderOptions): Promise<void> {
  const { canvas, images, settings, shapeSvgPath, dpi, shapeAnalysis, onProgress } = options;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  applyShapeClip(ctx, shapeSvgPath, canvas.width, canvas.height);

  const cells = getCellPositions(
    canvas.width,
    canvas.height,
    settings.gridRows,
    settings.gridCols,
    settings.padding * (dpi / 72)
  );

  const cellsWithVisibility = calculateCellVisibility(
    cells,
    shapeSvgPath,
    shapeAnalysis,
    images.length
  );

  const visibleCells = cellsWithVisibility.filter(cell => cell.shouldRender);

  onProgress?.(0);

  const imageMap = await processImages(images);

  const imagesToRender = images.slice(0, visibleCells.length);

  for (let i = 0; i < imagesToRender.length; i++) {
    const image = imagesToRender[i];
    const cell = visibleCells[i];
    const htmlImg = imageMap.get(image.id);

    if (!htmlImg) continue;

    drawImageCropped(ctx, htmlImg, cell.x, cell.y, cell.width, cell.height);

    applyEffect(ctx, cell, settings);

    onProgress?.((i + 1) / imagesToRender.length);
  }
}

function applyEffect(
  ctx: CanvasRenderingContext2D,
  cell: { x: number; y: number; width: number; height: number },
  settings: CollageSettings
): void {
  if (settings.effect === 'bw') {
    applyGrayscale(ctx, cell.x, cell.y, cell.width, cell.height);
  } else if (settings.effect === 'gradient' && settings.gradientColors) {
    applyGradientOverlay(
      ctx,
      cell.x,
      cell.y,
      cell.width,
      cell.height,
      settings.gradientColors[0],
      settings.gradientColors[1]
    );
  }
}

export function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

export function applyMaskToCanvas(canvas: HTMLCanvasElement, maskDataUrl: string): void {
  canvas.style.maskImage = `url("${maskDataUrl}")`;
  canvas.style.webkitMaskImage = `url("${maskDataUrl}")`;
  canvas.style.maskSize = 'contain';
  canvas.style.webkitMaskSize = 'contain';
  canvas.style.maskRepeat = 'no-repeat';
  canvas.style.webkitMaskRepeat = 'no-repeat';
  canvas.style.maskPosition = 'center';
  canvas.style.webkitMaskPosition = 'center';
}

export async function renderPreview(
  canvas: HTMLCanvasElement,
  options: Omit<RenderOptions, 'canvas'>
): Promise<void> {
  await renderCollage({
    ...options,
    canvas,
    dpi: 72,
  });
}

export async function renderExport(
  canvas: HTMLCanvasElement,
  options: Omit<RenderOptions, 'canvas'>
): Promise<void> {
  await renderCollage({
    ...options,
    canvas,
    dpi: 200,
  });
}

export function clearCanvas(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

export function getCanvasBlob(
  canvas: HTMLCanvasElement,
  type: string = 'image/png',
  quality?: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob from canvas'));
        }
      },
      type,
      quality
    );
  });
}
