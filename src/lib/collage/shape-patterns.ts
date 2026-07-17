import { Point } from './types';

export interface CellSelection {
  row: number;
  col: number;
  clipPath?: string;
  isEdge: boolean;
}

export interface GridPattern {
  getCells: (rows: number, cols: number) => CellSelection[];
  minGridSize: { rows: number; cols: number };
  optimalGridSize: { rows: number; cols: number };
  aspectRatio: number;
}

function isEdgeCell(
  row: number,
  col: number,
  allCells: Set<string>,
  rows: number,
  cols: number
): boolean {
  const key = `${row},${col}`;
  if (!allCells.has(key)) return false;

  const neighbors = [
    [row - 1, col],
    [row + 1, col],
    [row, col - 1],
    [row, col + 1],
  ];

  for (const [r, c] of neighbors) {
    if (r < 0 || r >= rows || c < 0 || c >= cols) return true;
    if (!allCells.has(`${r},${c}`)) return true;
  }

  return false;
}

const HEART_PATTERN: GridPattern = {
  getCells: (rows, cols) => {
    const cells: CellSelection[] = [];
    const cellSet = new Set<string>();

    const topLobeStart = Math.floor(rows * 0.15);
    const topLobeEnd = Math.floor(rows * 0.4);
    const middleStart = Math.floor(rows * 0.4);
    const middleEnd = Math.floor(rows * 0.7);
    const bottomStart = Math.floor(rows * 0.7);
    const bottomEnd = Math.floor(rows * 0.9);

    for (let r = topLobeStart; r < topLobeEnd; r++) {
      const leftLobeStart = Math.floor(cols * 0.25);
      const leftLobeEnd = Math.floor(cols * 0.45);
      const rightLobeStart = Math.floor(cols * 0.55);
      const rightLobeEnd = Math.floor(cols * 0.75);

      for (let c = leftLobeStart; c < leftLobeEnd; c++) {
        cellSet.add(`${r},${c}`);
      }
      for (let c = rightLobeStart; c < rightLobeEnd; c++) {
        cellSet.add(`${r},${c}`);
      }
    }

    for (let r = middleStart; r < middleEnd; r++) {
      const leftEdge = Math.floor(cols * 0.15);
      const rightEdge = Math.floor(cols * 0.85);
      for (let c = leftEdge; c < rightEdge; c++) {
        cellSet.add(`${r},${c}`);
      }
    }

    for (let r = bottomStart; r < bottomEnd; r++) {
      const progress = (r - bottomStart) / (bottomEnd - bottomStart);
      const narrowing = progress * 0.35;
      const leftEdge = Math.floor(cols * (0.15 + narrowing));
      const rightEdge = Math.floor(cols * (0.85 - narrowing));
      for (let c = leftEdge; c < rightEdge; c++) {
        cellSet.add(`${r},${c}`);
      }
    }

    cellSet.forEach((key) => {
      const [row, col] = key.split(',').map(Number);
      const isEdge = isEdgeCell(row, col, cellSet, rows, cols);
      cells.push({ row, col, isEdge });
    });

    return cells;
  },
  minGridSize: { rows: 10, cols: 10 },
  optimalGridSize: { rows: 15, cols: 15 },
  aspectRatio: 1,
};

const CIRCLE_PATTERN: GridPattern = {
  getCells: (rows, cols) => {
    const cells: CellSelection[] = [];
    const cellSet = new Set<string>();

    const centerRow = rows / 2;
    const centerCol = cols / 2;
    const radius = Math.min(rows, cols) * 0.45;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const dx = (c + 0.5 - centerCol) / cols * cols;
        const dy = (r + 0.5 - centerRow) / rows * rows;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= radius) {
          cellSet.add(`${r},${c}`);
        }
      }
    }

    cellSet.forEach((key) => {
      const [row, col] = key.split(',').map(Number);
      const isEdge = isEdgeCell(row, col, cellSet, rows, cols);
      cells.push({ row, col, isEdge });
    });

    return cells;
  },
  minGridSize: { rows: 10, cols: 10 },
  optimalGridSize: { rows: 15, cols: 15 },
  aspectRatio: 1,
};

const STAR_PATTERN: GridPattern = {
  getCells: (rows, cols) => {
    const cells: CellSelection[] = [];
    const cellSet = new Set<string>();

    const centerRow = rows / 2;
    const centerCol = cols / 2;
    const outerRadius = Math.min(rows, cols) * 0.45;
    const innerRadius = outerRadius * 0.4;

    const points = 5;
    const angleOffset = -Math.PI / 2;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const dx = c + 0.5 - centerCol;
        const dy = r + 0.5 - centerRow;
        const angle = Math.atan2(dy, dx);
        const distance = Math.sqrt(dx * dx + dy * dy);

        const normalizedAngle = ((angle - angleOffset + Math.PI * 2) % (Math.PI * 2));
        const segmentAngle = (Math.PI * 2) / points;
        const angleInSegment = normalizedAngle % segmentAngle;
        const segmentProgress = angleInSegment / segmentAngle;

        let radiusAtAngle: number;
        if (segmentProgress < 0.5) {
          radiusAtAngle = outerRadius - (outerRadius - innerRadius) * (segmentProgress * 2);
        } else {
          radiusAtAngle = innerRadius + (outerRadius - innerRadius) * ((segmentProgress - 0.5) * 2);
        }

        if (distance <= radiusAtAngle) {
          cellSet.add(`${r},${c}`);
        }
      }
    }

    cellSet.forEach((key) => {
      const [row, col] = key.split(',').map(Number);
      const isEdge = isEdgeCell(row, col, cellSet, rows, cols);
      cells.push({ row, col, isEdge });
    });

    return cells;
  },
  minGridSize: { rows: 12, cols: 12 },
  optimalGridSize: { rows: 18, cols: 18 },
  aspectRatio: 1,
};

const SQUARE_PATTERN: GridPattern = {
  getCells: (rows, cols) => {
    const cells: CellSelection[] = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const isEdge = r === 0 || r === rows - 1 || c === 0 || c === cols - 1;
        cells.push({ row: r, col: c, isEdge });
      }
    }

    return cells;
  },
  minGridSize: { rows: 5, cols: 5 },
  optimalGridSize: { rows: 10, cols: 10 },
  aspectRatio: 1,
};

const RECTANGLE_PATTERN: GridPattern = {
  getCells: (rows, cols) => {
    const cells: CellSelection[] = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const isEdge = r === 0 || r === rows - 1 || c === 0 || c === cols - 1;
        cells.push({ row: r, col: c, isEdge });
      }
    }

    return cells;
  },
  minGridSize: { rows: 5, cols: 7 },
  optimalGridSize: { rows: 10, cols: 15 },
  aspectRatio: 1.5,
};

const PATTERN_MAP: Record<string, GridPattern> = {
  heart: HEART_PATTERN,
  circle: CIRCLE_PATTERN,
  star: STAR_PATTERN,
  square: SQUARE_PATTERN,
  rectangle: RECTANGLE_PATTERN,
};

export function getShapePattern(shapeName: string): GridPattern | null {
  return PATTERN_MAP[shapeName] || null;
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
