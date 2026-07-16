import { ShapeTemplate, ShapeAnalysis, Point } from './types';

export const SHAPE_TEMPLATES: ShapeTemplate[] = [
  {
    name: 'heart',
    displayName: 'Heart',
    svgPath: 'M0.5,0.2 C0.5,0.1 0.4,0 0.3,0 C0.2,0 0.1,0.1 0.1,0.2 C0.1,0.3 0.1,0.4 0.2,0.5 L0.5,0.9 L0.8,0.5 C0.9,0.4 0.9,0.3 0.9,0.2 C0.9,0.1 0.8,0 0.7,0 C0.6,0 0.5,0.1 0.5,0.2 Z',
    aspectRatio: 1,
  },
  {
    name: 'circle',
    displayName: 'Circle',
    svgPath: 'M0.5,0.5 m-0.45,0 a0.45,0.45 0 1,0 0.9,0 a0.45,0.45 0 1,0 -0.9,0',
    aspectRatio: 1,
  },
  {
    name: 'star',
    displayName: 'Star',
    svgPath: 'M0.5,0.05 L0.61,0.38 L0.95,0.38 L0.68,0.59 L0.79,0.92 L0.5,0.71 L0.21,0.92 L0.32,0.59 L0.05,0.38 L0.39,0.38 Z',
    aspectRatio: 1,
  },
  {
    name: 'square',
    displayName: 'Square',
    svgPath: 'M0.1,0.1 L0.9,0.1 L0.9,0.9 L0.1,0.9 Z',
    aspectRatio: 1,
  },
  {
    name: 'rectangle',
    displayName: 'Rectangle',
    svgPath: 'M0.05,0.2 L0.95,0.2 L0.95,0.8 L0.05,0.8 Z',
    aspectRatio: 1.5,
  },
];

export function parseCustomSvg(svgContent: string): { path: string; viewBox: string } | null {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgContent, 'image/svg+xml');
    
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      throw new Error('Invalid SVG format');
    }

    const svgElement = doc.querySelector('svg');
    if (!svgElement) {
      throw new Error('No SVG element found');
    }

    const viewBox = svgElement.getAttribute('viewBox') || '0 0 100 100';
    
    const pathElements = doc.querySelectorAll('path');
    if (pathElements.length === 0) {
      throw new Error('No path elements found in SVG');
    }

    const paths = Array.from(pathElements)
      .map(p => p.getAttribute('d'))
      .filter(Boolean)
      .join(' ');

    if (!paths) {
      throw new Error('No valid path data found');
    }

    return { path: paths, viewBox };
  } catch (error) {
    console.error('Error parsing SVG:', error);
    return null;
  }
}

export function normalizeSvgPath(path: string, viewBox: string): string {
  const [, , width, height] = viewBox.split(' ').map(Number);
  
  if (!width || !height) {
    return path;
  }

  const normalizedPath = path.replace(
    /([ML])\s*(-?\d+\.?\d*)\s*,?\s*(-?\d+\.?\d*)/g,
    (match, command, x, y) => {
      const normalizedX = (parseFloat(x) / width).toFixed(4);
      const normalizedY = (parseFloat(y) / height).toFixed(4);
      return `${command}${normalizedX},${normalizedY}`;
    }
  );

  return normalizedPath;
}

export function createMaskDataUrl(svgPath: string): string {
  const svg = `
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1" preserveAspectRatio="none">
      <defs>
        <mask id="collage-mask" maskContentUnits="objectBoundingBox">
          <rect width="1" height="1" fill="white"/>
          <path d="${svgPath}" fill="white"/>
        </mask>
      </defs>
      <rect width="1" height="1" fill="black"/>
      <rect width="1" height="1" fill="white" mask="url(#collage-mask)"/>
    </svg>
  `.trim();
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

export function getShapeAspectRatio(shapeName: string): number {
  const template = SHAPE_TEMPLATES.find(t => t.name === shapeName);
  return template?.aspectRatio || 1;
}

export function validateSvgFile(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    if (!file.type.includes('svg')) {
      resolve(false);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const parsed = parseCustomSvg(content);
      resolve(parsed !== null);
    };
    reader.onerror = () => resolve(false);
    reader.readAsText(file);
  });
}

const shapeAnalysisCache = new Map<string, ShapeAnalysis>();

export function analyzeShape(svgPath: string, imageCount: number = 100, aspectRatio: number = 1): ShapeAnalysis {
  const cacheKey = `${svgPath}-${imageCount}-${aspectRatio}`;
  
  if (shapeAnalysisCache.has(cacheKey)) {
    return shapeAnalysisCache.get(cacheKey)!;
  }

  const shapePoints = sampleShapePoints(svgPath, 1000);
  const coverageArea = calculateCoverageArea(shapePoints);
  const { rows, cols } = suggestOptimalGrid(coverageArea, imageCount, aspectRatio);

  const analysis: ShapeAnalysis = {
    coverageArea,
    optimalGridRows: rows,
    optimalGridCols: cols,
    boundingBox: { x: 0, y: 0, width: 1, height: 1 },
    shapePoints,
  };

  shapeAnalysisCache.set(cacheKey, analysis);
  return analysis;
}

export function sampleShapePoints(svgPath: string, samples: number): Point[] {
  const points: Point[] = [];
  const gridSize = Math.ceil(Math.sqrt(samples));
  
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const px = x / (gridSize - 1);
      const py = y / (gridSize - 1);
      
      if (isPointInSvgShape(px, py, svgPath)) {
        points.push({ x: px, y: py });
      }
    }
  }
  
  return points;
}

export function calculateCoverageArea(points: Point[]): number {
  const totalSamples = 1000;
  const gridSize = Math.ceil(Math.sqrt(totalSamples));
  const totalCells = gridSize * gridSize;
  
  return points.length / totalCells;
}

export function suggestOptimalGrid(
  coverageArea: number,
  imageCount: number,
  aspectRatio: number
): { rows: number; cols: number } {
  if (imageCount <= 0 || coverageArea <= 0) {
    return { rows: 10, cols: 10 };
  }

  const buffer = 1.2;
  const targetCells = Math.ceil((imageCount / coverageArea) * buffer);
  
  const cols = Math.ceil(Math.sqrt(targetCells * aspectRatio));
  const rows = Math.ceil(targetCells / cols);
  
  const clampedRows = Math.max(3, Math.min(50, rows));
  const clampedCols = Math.max(3, Math.min(50, cols));
  
  return { rows: clampedRows, cols: clampedCols };
}

export function isPointInSvgShape(x: number, y: number, svgPath: string): boolean {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return false;
    
    const path = new Path2D(scaleSvgPath(svgPath, 100, 100));
    return ctx.isPointInPath(path, x * 100, y * 100);
  } catch (error) {
    console.error('Error testing point in shape:', error);
    return false;
  }
}

function scaleSvgPath(normalizedPath: string, width: number, height: number): string {
  return normalizedPath.replace(
    /([ML])\s*(-?\d+\.?\d*)\s*,?\s*(-?\d+\.?\d*)/g,
    (match, command, x, y) => {
      const scaledX = parseFloat(x) * width;
      const scaledY = parseFloat(y) * height;
      return `${command}${scaledX},${scaledY}`;
    }
  );
}
