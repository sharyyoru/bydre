import { CellPosition } from './types';

export function calculateOptimalGrid(
  imageCount: number,
  aspectRatio: number = 1
): { rows: number; cols: number } {
  if (imageCount <= 0) {
    return { rows: 0, cols: 0 };
  }

  const cols = Math.ceil(Math.sqrt(imageCount * aspectRatio));
  const rows = Math.ceil(imageCount / cols);

  return { rows, cols };
}

export function getCellPositions(
  canvasWidth: number,
  canvasHeight: number,
  rows: number,
  cols: number,
  padding: number
): CellPosition[] {
  const cells: CellPosition[] = [];
  
  if (rows === 0 || cols === 0) {
    return cells;
  }

  const totalPaddingWidth = padding * (cols + 1);
  const totalPaddingHeight = padding * (rows + 1);
  
  const cellWidth = (canvasWidth - totalPaddingWidth) / cols;
  const cellHeight = (canvasHeight - totalPaddingHeight) / rows;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      cells.push({
        x: padding + col * (cellWidth + padding),
        y: padding + row * (cellHeight + padding),
        width: cellWidth,
        height: cellHeight,
      });
    }
  }

  return cells;
}

export function getCanvasDimensions(
  dpi: number,
  targetWidthInches: number = 78.74 // 2 meters
): { width: number; height: number } {
  const width = Math.round(targetWidthInches * dpi);
  const height = width;
  
  return { width, height };
}

export function calculateGridFromDimensions(
  imageCount: number,
  preferredCols?: number
): { rows: number; cols: number } {
  if (preferredCols) {
    const cols = preferredCols;
    const rows = Math.ceil(imageCount / cols);
    return { rows, cols };
  }

  return calculateOptimalGrid(imageCount);
}

export function isWithinBrowserLimits(width: number, height: number): boolean {
  const MAX_CANVAS_SIZE = 16384;
  return width <= MAX_CANVAS_SIZE && height <= MAX_CANVAS_SIZE;
}

export function getSafeDimensions(
  requestedWidth: number,
  requestedHeight: number
): { width: number; height: number; scaled: boolean } {
  const MAX_CANVAS_SIZE = 16384;
  
  if (requestedWidth <= MAX_CANVAS_SIZE && requestedHeight <= MAX_CANVAS_SIZE) {
    return { width: requestedWidth, height: requestedHeight, scaled: false };
  }

  const scale = Math.min(
    MAX_CANVAS_SIZE / requestedWidth,
    MAX_CANVAS_SIZE / requestedHeight
  );

  return {
    width: Math.floor(requestedWidth * scale),
    height: Math.floor(requestedHeight * scale),
    scaled: true,
  };
}
