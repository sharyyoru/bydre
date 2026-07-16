import { ShapeTemplate } from './types';

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
