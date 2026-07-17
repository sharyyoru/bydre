import { RenderOptions, CollageSettings } from './types';
import { getCellPositions } from './grid-calculator';
import {
  processImages,
  drawImageCropped,
  applyGrayscale,
  applyGradientOverlay,
} from './image-processor';
import { getShapePattern } from './shape-patterns';
import { generatePatternFromSVG } from './svg-processor';

function scaleSvgPathToCanvas(normalizedPath: string, width: number, height: number): string {
  let result = '';
  const commands = normalizedPath.match(/[MLHVCSQTAZ][^MLHVCSQTAZ]*/gi) || [];
  
  for (const cmd of commands) {
    const command = cmd[0];
    const coords = cmd.slice(1).trim().split(/[\s,]+/).filter(Boolean).map(Number);
    
    result += command;
    
    for (let i = 0; i < coords.length; i += 2) {
      const x = coords[i] * width;
      const y = coords[i + 1] !== undefined ? coords[i + 1] * height : 0;
      
      if (i > 0) result += ' ';
      if (coords[i + 1] !== undefined) {
        result += `${x},${y}`;
      } else {
        result += `${x}`;
      }
    }
  }
  
  return result;
}

function createEdgeClipPath(
  svgPath: string,
  cellX: number,
  cellY: number,
  cellWidth: number,
  cellHeight: number,
  canvasWidth: number,
  canvasHeight: number
): string | undefined {
  try {
    const normalizedCellX = cellX / canvasWidth;
    const normalizedCellY = cellY / canvasHeight;
    const normalizedCellWidth = cellWidth / canvasWidth;
    const normalizedCellHeight = cellHeight / canvasHeight;

    const commands = svgPath.match(/[MLHVCSQTAZ][^MLHVCSQTAZ]*/gi) || [];
    let result = '';

    for (const cmd of commands) {
      const command = cmd[0];
      const coords = cmd.slice(1).trim().split(/[\s,]+/).filter(Boolean).map(Number);
      
      result += command;
      
      for (let i = 0; i < coords.length; i += 2) {
        const x = (coords[i] - normalizedCellX) / normalizedCellWidth * cellWidth;
        const y = coords[i + 1] !== undefined 
          ? (coords[i + 1] - normalizedCellY) / normalizedCellHeight * cellHeight 
          : 0;
        
        if (i > 0) result += ' ';
        if (coords[i + 1] !== undefined) {
          result += `${x},${y}`;
        } else {
          result += `${x}`;
        }
      }
    }

    return result;
  } catch (error) {
    console.error('Error creating edge clip path:', error);
    return undefined;
  }
}

export async function renderCollage(options: RenderOptions): Promise<void> {
  const { canvas, images, settings, shapeSvgPath, shapeName, dpi, onProgress } = options;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const allCells = getCellPositions(
    canvas.width,
    canvas.height,
    settings.gridRows,
    settings.gridCols,
    settings.padding * (dpi / 72)
  );

  let selectedCells: Array<{ row: number; col: number; isEdge: boolean }> = [];

  if (shapeName) {
    const pattern = getShapePattern(shapeName);
    if (pattern) {
      selectedCells = pattern.getCells(settings.gridRows, settings.gridCols);
    }
  }

  if (selectedCells.length === 0) {
    selectedCells = generatePatternFromSVG(shapeSvgPath, settings.gridRows, settings.gridCols);
  }

  const cellsToRender = selectedCells.map((sel) => {
    const cellIndex = sel.row * settings.gridCols + sel.col;
    const cell = allCells[cellIndex];
    return {
      ...cell,
      isEdge: sel.isEdge,
    };
  });

  onProgress?.(0);

  const imageMap = await processImages(images);
  const imagesToRender = images.slice(0, cellsToRender.length);

  for (let i = 0; i < imagesToRender.length; i++) {
    const image = imagesToRender[i];
    const cell = cellsToRender[i];
    const htmlImg = imageMap.get(image.id);

    if (!htmlImg) continue;

    if (cell.isEdge) {
      ctx.save();
      const clipPath = createEdgeClipPath(
        shapeSvgPath,
        cell.x,
        cell.y,
        cell.width,
        cell.height,
        canvas.width,
        canvas.height
      );
      
      if (clipPath) {
        try {
          const path = new Path2D(clipPath);
          ctx.translate(cell.x, cell.y);
          ctx.clip(path);
          ctx.translate(-cell.x, -cell.y);
        } catch (error) {
          console.error('Error applying edge clip:', error);
        }
      }
    }

    drawImageCropped(ctx, htmlImg, cell.x, cell.y, cell.width, cell.height);
    applyEffect(ctx, cell, settings);

    if (cell.isEdge) {
      ctx.restore();
    }

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
