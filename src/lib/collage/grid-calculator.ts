import { CellPosition, CellVisibility, ShapeAnalysis } from './types';
import { isPointInSvgShape } from './svg-processor';
import { GridPattern } from './shape-patterns';

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

export function calculateCellVisibility(
  cells: CellPosition[],
  shapeSvgPath: string,
  shapeAnalysis?: ShapeAnalysis,
  imageCount: number = 100,
  canvasWidth: number = 1,
  canvasHeight: number = 1
): CellVisibility[] {
  const threshold = calculateVisibilityThreshold(shapeAnalysis, imageCount, cells.length);
  
  return cells.map((cell) => {
    const visibilityPercentage = calculateCellVisibilityPercentage(
      cell,
      shapeSvgPath,
      canvasWidth,
      canvasHeight
    );
    const shouldRender = visibilityPercentage >= threshold;
    
    return {
      ...cell,
      visibilityPercentage,
      shouldRender,
    };
  });
}

function calculateCellVisibilityPercentage(
  cell: CellPosition,
  shapeSvgPath: string,
  canvasWidth: number,
  canvasHeight: number
): number {
  const samplePoints = 9;
  const gridSize = 3;
  let visiblePoints = 0;
  
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const px = cell.x + (cell.width * (x + 0.5)) / gridSize;
      const py = cell.y + (cell.height * (y + 0.5)) / gridSize;
      
      const normalizedX = px / canvasWidth;
      const normalizedY = py / canvasHeight;
      
      if (isPointInSvgShape(normalizedX, normalizedY, shapeSvgPath)) {
        visiblePoints++;
      }
    }
  }
  
  return (visiblePoints / samplePoints) * 100;
}

export function calculateVisibilityThreshold(
  shapeAnalysis: ShapeAnalysis | undefined,
  imageCount: number,
  totalCells: number
): number {
  if (!shapeAnalysis || totalCells === 0) {
    return 50;
  }
  
  const fillRatio = imageCount / totalCells;
  
  const baseThreshold = 30;
  const maxThreshold = 70;
  const adjustment = (1 - fillRatio) * 40;
  
  const threshold = Math.max(baseThreshold, Math.min(maxThreshold, baseThreshold + adjustment));
  
  return threshold;
}

export function calculateOptimalGridForPattern(
  pattern: GridPattern,
  imageCount: number
): { rows: number; cols: number } {
  let { rows, cols } = pattern.optimalGridSize;

  const patternCells = pattern.getCells(rows, cols).length;

  if (imageCount > patternCells) {
    const scaleFactor = Math.sqrt(imageCount / patternCells);
    rows = Math.ceil(rows * scaleFactor);
    cols = Math.ceil(cols * scaleFactor);
  }

  rows = Math.max(rows, pattern.minGridSize.rows);
  cols = Math.max(cols, pattern.minGridSize.cols);

  rows = Math.min(rows, 50);
  cols = Math.min(cols, 50);

  return { rows, cols };
}
